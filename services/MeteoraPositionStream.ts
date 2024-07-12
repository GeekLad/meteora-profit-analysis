import type { Connection } from "@solana/web3.js";

import { Transform } from "stream";

import {
  ParsedTransactionStream,
  type ParsedTransactionStreamData,
  type ParsedTransactionStreamAllTransactionsFound,
  type ParsedTransactionStreamSignatureCount,
} from "./ParsedTransactionStream";
import { getDlmmPairs, type MeteoraDlmmPair } from "./MeteoraDlmmApi";
import {
  getJupiterTokenList,
  type JupiterTokenListToken,
} from "./JupiterTokenList";
import {
  parseMeteoraTransactions,
  type MeteoraPositionTransaction,
} from "./ParseMeteoraTransactions";
import { MeteoraPosition, invertAndFillMissingFees } from "./MeteoraPosition";
import { unique } from "./util";
import { updateOpenPositions } from "./UpdateOpenPositions";

interface MeteoraPositionStreamTransactionCount {
  type: "transactionCount";
  meteoraTransactionCount: number;
}

interface MeteoraPositionStreamPositionsAndTransactions {
  type: "positionsAndTransactions";
  transactions: MeteoraPositionTransaction[];
  positions: MeteoraPosition[];
}

interface MeteoraPositionStreamUpdatingOpenPositions {
  type: "updatingOpenPositions";
  openPositionCount: number;
}

export type MeteoraPositionStreamData =
  | ParsedTransactionStreamSignatureCount
  | ParsedTransactionStreamAllTransactionsFound
  | MeteoraPositionStreamTransactionCount
  | MeteoraPositionStreamPositionsAndTransactions
  | MeteoraPositionStreamUpdatingOpenPositions;

interface MeteoraPositionStreamEvents {
  data: (data: MeteoraPositionStreamData) => void;
  error: (error: Error) => void;
  end: () => void;
}

export class MeteoraPositionStream extends Transform {
  private _pairs: Map<string, MeteoraDlmmPair> = new Map();
  private _tokenList: Map<string, JupiterTokenListToken> = new Map();
  private _receivedAllTransactions = false;
  private _transactionsReceivedCount = 0;
  private _transactionsProcessedCount = 0;
  private _transactions: MeteoraPositionTransaction[] = [];
  private _updatingOpenPositions = false;

  constructor(
    connection: Connection,
    walletAddress: string,
    before?: string,
    until?: string,
    minDate?: Date,
  ) {
    super({ objectMode: true });
    this._init(connection, walletAddress, before, until, minDate);
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
    this._tokenList = await getJupiterTokenList();

    new ParsedTransactionStream(
      connection,
      walletAddress,
      before,
      until,
      minDate,
    )
      .on("data", (data) => this._parseTransactions(connection, data))
      .on("end", () => {
        this._receivedAllTransactions = true;
      })
      .on("error", (error) => this.emit("error", error));
  }

  private async _parseTransactions(
    connection: Connection,
    data: ParsedTransactionStreamData,
  ) {
    if (data.type != "parsedTransaction") {
      switch (data.type) {
        case "allSignaturesFound":
          this._receivedAllTransactions = true;
          break;
        case "signatureCount":
          this._transactionsReceivedCount = data.signatureCount;
          break;
      }
      this.push(data);

      return this._updateOpenPositions(connection);
    }

    const positionTransactions = await parseMeteoraTransactions(
      connection,
      this._pairs,
      this._tokenList,
      data.parsedTransactionWithMeta,
    );

    positionTransactions.forEach((positionTransaction) => {
      this._transactions.push(positionTransaction);
      this.push({
        type: "transactionCount",
        meteoraTransactionCount: this._transactions.length,
      });
    });

    this._transactionsProcessedCount++;
    this._updateOpenPositions(connection);
  }

  private async _updateOpenPositions(connection: Connection) {
    if (
      !this._updatingOpenPositions &&
      this._receivedAllTransactions &&
      this._transactionsReceivedCount == this._transactionsProcessedCount
    ) {
      this._updatingOpenPositions = true;
      this._transactions = invertAndFillMissingFees(this._transactions);

      const positionAddresses = unique(
        this._transactions.map((transaction) => transaction.position),
      );

      const allPositions = positionAddresses.map((positionAddress) => {
        const positionTransactions = this._transactions.filter(
          (transaction) => transaction.position == positionAddress,
        );

        return new MeteoraPosition(positionTransactions);
      });

      const positions = allPositions.filter(
        (position) => position.depositsValue < 0,
      );

      const openPositions = positions.filter((position) => !position.isClosed);

      if (openPositions.length > 0) {
        this.push({
          type: "updatingOpenPositions",
          openPositionCount: openPositions.length,
        });
        await updateOpenPositions(connection, positions);
      }

      this.push({
        type: "positionsAndTransactions",
        transactions: this._transactions,
        positions,
      });
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
    return super.push(chunk, encoding);
  }
}
