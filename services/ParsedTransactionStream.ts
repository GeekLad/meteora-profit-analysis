import type {
  Connection,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

import { Transform } from "stream";

import { SignatureStream } from "./SignatureStream";
import { getParsedTransactions } from "./ConnectionThrottle";
import { AsyncBatchProcessor, delay } from "./util";

export interface ParsedTransactionStreamSignatureCount {
  type: "signatureCount";
  signatureCount: number;
}

export interface ParsedTransactionStreamAllTransactionsFound {
  type: "allSignaturesFound";
}

interface ParsedTransactionStreamParsedTransactionWithMeta {
  type: "parsedTransaction";
  parsedTransactionsWithMeta: ParsedTransactionWithMeta[];
}

export type ParsedTransactionStreamData =
  | ParsedTransactionStreamSignatureCount
  | ParsedTransactionStreamAllTransactionsFound
  | ParsedTransactionStreamParsedTransactionWithMeta;

interface ParsedTransactionStreamEvents {
  data: (data: ParsedTransactionStreamData) => void;
  error: (error: Error) => void;
  end: () => void;
}

export class ParsedTransactionStream extends Transform {
  private _connection: Connection;
  private _signatureCount = 0;
  private _processedCount = 0;
  private _allSignaturesFound?: ParsedTransactionStreamAllTransactionsFound;
  private _processor: AsyncBatchProcessor<
    string,
    ParsedTransactionWithMeta | null
  >;

  constructor(
    connection: Connection,
    walletAddress: string,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    super({ objectMode: true });
    this._connection = connection;
    this._processor = new AsyncBatchProcessor((signatures) =>
      getParsedTransactions(this._connection, signatures, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      }),
    );
    new SignatureStream(connection, walletAddress, before, until, minDate)
      .on("data", (signatures: ConfirmedSignatureInfo[]) =>
        this._processSignatures(signatures),
      )
      .on("end", async () => {
        this._allSignaturesFound = { type: "allSignaturesFound" };
        this.push(this._allSignaturesFound);

        while (!this._processor.isComplete) {
          await this._processBatch();
          await delay(0);
        }
      })
      .on("error", (error) => this.emit("error", error));
  }

  private async _processBatch() {
    const { inputCount, output } = await this._processor.next();

    const parsedTransactionsWithMeta = output.filter(
      (parsedTransaction) => parsedTransaction != null,
    ) as ParsedTransactionWithMeta[];

    this._processedCount += inputCount;

    if (parsedTransactionsWithMeta.length > 0) {
      this.push({
        type: "parsedTransaction",
        parsedTransactionsWithMeta,
      });
    }
    this._finish();
  }

  private async _processSignatures(signatures: ConfirmedSignatureInfo[]) {
    this._signatureCount += signatures.length;
    this.push({
      type: "signatureCount",
      signatureCount: this._signatureCount,
    });
    const signatureStrings = signatures.map((signature) => signature.signature);

    this._processor.addBatch(signatureStrings);
    this._processBatch();
  }

  private _finish() {
    if (
      this._allSignaturesFound &&
      this._signatureCount == this._processedCount
    ) {
      this.push(null);
    }
  }

  on<Event extends keyof ParsedTransactionStreamEvents>(
    event: Event,
    listener: ParsedTransactionStreamEvents[Event],
  ): this {
    return super.on(event, listener);
  }

  emit<Event extends keyof ParsedTransactionStreamEvents>(
    event: Event,
    ...args: Parameters<ParsedTransactionStreamEvents[Event]>
  ): boolean {
    return super.emit(event, ...args);
  }

  push(
    chunk: ParsedTransactionStreamData | null,
    encoding?: BufferEncoding,
  ): boolean {
    return super.push(chunk, encoding);
  }
}
