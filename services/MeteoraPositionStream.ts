import type { Connection } from "@solana/web3.js";

import { Transform } from "stream";

import {
  ParsedTransactionStream,
  type ParsedTransactionStreamData,
  type ParsedTransactionStreamSignatureCount,
} from "./ParsedTransactionStream";
import { getDlmmPairs, type MeteoraDlmmPair } from "./MeteoraDlmmApi";
import { type JupiterTokenListToken } from "./JupiterTokenList";
import {
  parseMeteoraTransactions,
  type MeteoraPositionTransaction,
} from "./ParseMeteoraTransactions";
import { MeteoraPosition, invertAndFillMissingFees } from "./MeteoraPosition";
import { updateOpenPosition } from "./UpdateOpenPositions";

interface MeteoraPositionStreamAllTransactionsFound {
  type: "allSignaturesFound";
}

interface MeteoraPositionStreamTransactionCount {
  type: "transactionCount";
  meteoraTransactionCount: number;
}

interface MeteoraPositionStreamPositionAndTransactions {
  type: "positionAndTransactions";
  transactions: MeteoraPositionTransaction[];
  position: MeteoraPosition;
}

interface MeteoraPositionStreamUpdatingOpenPositions {
  type: "updatingOpenPositions";
  openPositionCount: number;
}

export type MeteoraPositionStreamData =
  | ParsedTransactionStreamSignatureCount
  | MeteoraPositionStreamAllTransactionsFound
  | MeteoraPositionStreamTransactionCount
  | MeteoraPositionStreamPositionAndTransactions
  | MeteoraPositionStreamUpdatingOpenPositions;

interface MeteoraPositionStreamEvents {
  data: (data: MeteoraPositionStreamData) => void;
  error: (error: Error) => void;
  end: () => void;
}

export class MeteoraPositionStream extends Transform {
  private _pairs: Map<string, MeteoraDlmmPair> = new Map();
  private _tokenMap: Map<string, JupiterTokenListToken>;
  private _transactionStream!: ParsedTransactionStream;
  private _receivedAllTransactions = false;
  private _transactionsReceivedCount = 0;
  private _signaturesProcessedCount = 0;
  private _transactions: MeteoraPositionTransaction[] = [];
  private _done = false;
  private _cancelling = false;
  private _cancelled = false;
  private _pendingPositions: string[] = [];

  constructor(
    connection: Connection,
    walletAddress: string,
    tokenMap: Map<string, JupiterTokenListToken>,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    super({ objectMode: true });
    this._tokenMap = tokenMap;
    this._init(connection, walletAddress, before, until, minDate);
  }

  cancel() {
    this._transactionStream.cancel();
    this._cancelling = true;
  }

  private async _init(
    connection: Connection,
    walletAddress: string,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    const { pairs } = await getDlmmPairs();

    this._pairs = pairs;

    this._transactionStream = new ParsedTransactionStream(
      connection,
      walletAddress,
      before,
      until,
      minDate,
    )
      .on("data", (data) => this._parseTransactions(connection, data))
      .on("end", async () => {
        this._receivedAllTransactions = true;
        this.push({
          type: "allSignaturesFound",
        });
        this._finish();
      })
      .on("error", (error) => this.emit("error", error));
  }

  private async _parseTransactions(
    connection: Connection,
    data: ParsedTransactionStreamData,
  ) {
    if (data.type != "parsedTransactions") {
      switch (data.type) {
        case "signatureCount":
          this._transactionsReceivedCount = data.signatureCount;
          break;
      }
      this.push(data);

      return this._finish();
    }
    if (!this._cancelling && !this._cancelled) {
      const meteoraTransactions = await parseMeteoraTransactions(
        connection,
        this._pairs,
        this._tokenMap,
        data.parsedTransactionsWithMeta,
      );

      this._transactions = this._transactions.concat(meteoraTransactions);
      this.push({
        type: "transactionCount",
        meteoraTransactionCount: this._transactions.length,
      });

      await Promise.all(
        meteoraTransactions.map(async (positionTransaction) => {
          if (positionTransaction.open) {
            await this._createPosition(connection, positionTransaction);
          }
        }),
      );
      this._signaturesProcessedCount += data.signaturesProcessedCount;
      this._finish();
    }
  }

  private async _createPosition(
    connection: Connection,
    positionTransaction: MeteoraPositionTransaction,
  ) {
    this._pendingPositions.push(positionTransaction.position);
    const newPositionTransactions = invertAndFillMissingFees(
      this._transactions.filter(
        (transaction) => transaction.position == positionTransaction.position,
      ),
    );
    const newPosition = new MeteoraPosition(newPositionTransactions);

    if (newPosition.isClosed) {
      this.push({
        type: "positionAndTransactions",
        transactions: newPositionTransactions,
        position: newPosition,
      });
    } else {
      await this._updateOpenPosition(
        connection,
        newPositionTransactions,
        newPosition,
      );
    }
    this._pendingPositions.splice(
      this._pendingPositions.indexOf(positionTransaction.position),
      1,
    );
  }

  private async _updateOpenPosition(
    connection: Connection,
    transactions: MeteoraPositionTransaction[],
    position: MeteoraPosition,
  ) {
    await updateOpenPosition(connection, position);
    this.push({
      type: "positionAndTransactions",
      transactions,
      position,
    });
  }

  private async _finish() {
    if (
      this._receivedAllTransactions &&
      this._transactionsReceivedCount == this._signaturesProcessedCount &&
      !this._done
    ) {
      this._done = true;
      this.push(null);
    }
  }

  on<Event extends keyof MeteoraPositionStreamEvents>(
    event: Event,
    listener: MeteoraPositionStreamEvents[Event],
  ): this {
    return super.on(event, listener);
  }

  emit<Event extends keyof MeteoraPositionStreamEvents>(
    event: Event,
    ...args: Parameters<MeteoraPositionStreamEvents[Event]>
  ): boolean {
    return super.emit(event, ...args);
  }

  push(
    chunk: MeteoraPositionStreamData | null,
    encoding?: BufferEncoding,
  ): boolean {
    if (this._pendingPositions.length > 0) {
      return super.push(chunk, encoding);
    }
    if (this._cancelling && !this._cancelled) {
      this._cancelled = true;

      return super.push(null);
    }
    if (this._cancelled) {
      return false;
    }

    return super.push(chunk, encoding);
  }
}
