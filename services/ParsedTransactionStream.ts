import type {
  Connection,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
} from "@solana/web3.js";

import { Transform } from "stream";

import { SignatureStream } from "./SignatureStream";

export interface ParsedTransactionStreamSignatureCount {
  type: "signatureCount";
  signatureCount: number;
}

export interface ParsedTransactionStreamAllTransactionsFound {
  type: "allSignaturesFound";
}

interface ParsedTransactionStreamParsedTransactionWithMeta {
  type: "parsedTransaction";
  parsedTransactionWithMeta: ParsedTransactionWithMeta;
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

  constructor(
    connection: Connection,
    walletAddress: string,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    super({ objectMode: true });
    this._connection = connection;
    new SignatureStream(connection, walletAddress, before, until, minDate)
      .on("data", (signatures: ConfirmedSignatureInfo[]) =>
        this._processSignatures(signatures),
      )
      .on("end", () => {
        this._allSignaturesFound = { type: "allSignaturesFound" };
        this.push(this._allSignaturesFound);
      })
      .on("error", (error) => this.emit("error", error));
  }

  private async _processSignatures(signatures: ConfirmedSignatureInfo[]) {
    this._signatureCount += signatures.length;
    this.push({
      type: "signatureCount",
      signatureCount: this._signatureCount,
    });
    const signatureStrings = signatures.map((signature) => signature.signature);
    const parsedTransactions = await this._connection.getParsedTransactions(
      signatureStrings,
      {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      },
    );

    parsedTransactions.forEach((parsedTransaction) => {
      this._processedCount++;
      if (parsedTransaction != null) {
        const parsedTransactionStreamData: ParsedTransactionStreamParsedTransactionWithMeta =
          {
            type: "parsedTransaction",
            parsedTransactionWithMeta: parsedTransaction,
          };

        this.push(parsedTransactionStreamData);
      }
    });
    this._finish();
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
