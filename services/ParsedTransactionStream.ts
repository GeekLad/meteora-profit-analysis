import { Transform } from "stream";

import {
  Connection,
  ConfirmedSignatureInfo,
  ParsedTransactionWithMeta,
  PublicKey,
} from "@solana/web3.js";

import {
  getConfirmedSignaturesForAddress2,
  getParsedTransactions,
} from "./ConnectionThrottle";
import { chunkArray } from "./util";

const CHUNK_SIZE = 500;

export interface ParsedTransactionStreamSignatureCount {
  type: "signatureCount";
  signatureCount: number;
}

interface ParsedTransactionStreamParsedTransactionWithMeta {
  type: "parsedTransactions";
  signaturesProcessedCount: number;
  parsedTransactionsWithMeta: ParsedTransactionWithMeta[];
}

export type ParsedTransactionStreamData =
  | ParsedTransactionStreamSignatureCount
  | ParsedTransactionStreamParsedTransactionWithMeta;

interface ParsedTransactionStreamEvents {
  data: (data: ParsedTransactionStreamData) => void;
  error: (error: Error) => void;
  end: () => void;
}

export class ParsedTransactionStream extends Transform {
  private _connection: Connection;
  private _walletAddress: PublicKey;
  private _cancel = false;
  private _before?: string;
  private _until?: string;
  private _minDate?: Date;
  private _signatureCount = 0;
  private _signaturesProcessedCount = 0;
  private _cancelling = false;
  private _cancelled = false;

  constructor(
    connection: Connection,
    walletAddress: string,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    super({ objectMode: true });
    this._connection = connection;
    this._walletAddress = new PublicKey(walletAddress);
    this._before = before;
    this._until = until;
    this._minDate = minDate;
    this._fetchSignatures();
  }

  private async _fetchSignatures() {
    let newSignatures: ConfirmedSignatureInfo[] = [];
    let lastDate = new Date();

    do {
      newSignatures = await getConfirmedSignaturesForAddress2(
        this._connection,
        this._walletAddress,
        {
          before: this._before,
          until: this._until,
        },
        "confirmed",
      );
      if (newSignatures.length > 0) {
        const validSignatures = newSignatures.filter(
          (signature) => !signature.err,
        );

        if (validSignatures.length > 0) {
          const chunks =
            validSignatures.length > CHUNK_SIZE
              ? chunkArray(
                  validSignatures,
                  Math.floor(validSignatures.length / 2),
                )
              : [validSignatures];

          const parsedTransactionsWithMeta: ParsedTransactionWithMeta[] = [];

          for (let i = 0; i < chunks.length; i++) {
            let chunk = chunks[i];
            let newParsedTransactionsWithMeta =
              await this._processSignatures(chunk);

            newParsedTransactionsWithMeta.forEach((parsedTransactionWithMeta) =>
              parsedTransactionsWithMeta.push(
                parsedTransactionWithMeta as ParsedTransactionWithMeta,
              ),
            );
          }

          if (parsedTransactionsWithMeta.length > 0) {
            this.push({
              type: "parsedTransactions",
              signaturesProcessedCount: this._signaturesProcessedCount,
              parsedTransactionsWithMeta,
            });
          }
        }
        this._before = newSignatures[newSignatures.length - 1].signature;
        lastDate = new Date(
          validSignatures[validSignatures.length - 1].blockTime! * 1000,
        );
      }
    } while (
      !this._cancel &&
      newSignatures.length > 0 &&
      (!this._minDate || (this._minDate && lastDate > this._minDate))
    );
    if (!this._cancelling && !this._cancelled) {
      this.push(null);
    }
  }

  cancel() {
    this._cancel = true;
    this._cancelling = true;
  }

  private async _processSignatures(signatures: ConfirmedSignatureInfo[]) {
    this._signatureCount += signatures.length;
    this.push({
      type: "signatureCount",
      signatureCount: this._signatureCount,
    });
    const signatureStrings = signatures.map((signature) => signature.signature);
    const parsedTransactions = await getParsedTransactions(
      this._connection,
      signatureStrings,
      {
        maxSupportedTransactionVersion: 0,
      },
    );

    this._signaturesProcessedCount += signatures.length;

    return parsedTransactions.filter(
      (parsedTransaction) => parsedTransaction != null,
    );
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
    if (this._cancelling) {
      if (!this._cancelled) {
        this._cancelled = true;

        return this.push(null);
      }

      return false;
    }

    return super.push(chunk, encoding);
  }
}
