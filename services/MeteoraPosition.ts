import type { MeteoraPositionTransaction } from "./ParseMeteoraTransactions";

import { summarize, unique } from "./util";

const SPECIAL_MINTS = [
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
];

function shouldInvert(transaction: MeteoraPositionTransaction) {
  if (SPECIAL_MINTS.includes(transaction.mintX)) {
    if (transaction.mintX == "So11111111111111111111111111111111111111112") {
      if (!SPECIAL_MINTS.includes(transaction.mintY)) {
        return true;
      }
    } else {
      if (transaction.mintY != "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB") {
        return true;
      }
    }
  } else if (!SPECIAL_MINTS.includes(transaction.mintY)) {
    const sortedMints = [transaction.mintX, transaction.mintY]
      .sort((a, b) => a.localeCompare(b))
      .join("");

    return sortedMints != transaction.mintX + transaction.mintY;
  }

  return false;
}

export function filterPositionsByTimeMs(
  positions: MeteoraPosition[],
  start: number,
  end: number,
) {
  return positions.filter(
    (position) =>
      position.openTimestampMs >= start &&
      (!position.isClosed || position.closeTimestampMs <= end),
  );
}

export function filterPositionsByMintYAddress(
  positions: MeteoraPosition[],
  mintAddresses: string[],
) {
  return positions.filter((position) => mintAddresses.includes(position.mintY));
}

export function filterPositionsByMintXAddress(
  positions: MeteoraPosition[],
  mintAddresses: string[],
) {
  return positions.filter((position) => mintAddresses.includes(position.mintX));
}

export function meteoraPositionTransactionSorter(
  a: MeteoraPositionTransaction,
  b: MeteoraPositionTransaction,
): number {
  if (a.timestamp_ms != b.timestamp_ms) {
    return a.timestamp_ms - b.timestamp_ms;
  }
  if (a.price === null && b.price === null) {
    return 0;
  }
  if (a.price !== null) {
    return -1;
  }

  return 1;
}

export function invertAndFillMissingFees(
  transactions: MeteoraPositionTransaction[],
): MeteoraPositionTransaction[] {
  const sortedTransactions = transactions.sort(
    meteoraPositionTransactionSorter,
  );

  const invertedTransactions = sortedTransactions.map((transaction) => {
    if (shouldInvert(transaction)) {
      return invertMeteoraPositionTransaction(transaction);
    }

    return transaction;
  });

  const yMints = unique(
    invertedTransactions.map((transaction) => transaction.mintY),
  );
  const xMints = unique(
    invertedTransactions.map((transaction) => transaction.mintX),
  );

  yMints.forEach((yMint) => {
    xMints.forEach((xMint) => {
      const mintTransactions = invertedTransactions.filter(
        (transaction) =>
          transaction.mintX == xMint && transaction.mintY == yMint,
      );

      mintTransactions.forEach((transaction, index) => {
        if (transaction.price === null && index > 0) {
          transaction.price = mintTransactions[index - 1].price;
          transaction.priceIsEstimated = true;
          if (
            transaction.price &&
            transaction.claimedFeesValue == 0 &&
            (transaction.mintXFeesClaimed > 0 ||
              transaction.mintYFeesClaimed > 0)
          ) {
            transaction.claimedFeesValue =
              Math.floor(
                (transaction.price * transaction.mintXFeesClaimed +
                  transaction.mintYFeesClaimed) *
                  10 ** transaction.mintYDecimals,
              ) /
              10 ** transaction.mintYDecimals;
          }
        }
      });
    });
  });

  return invertedTransactions;
}

function invertMeteoraPositionTransaction(
  transaction: MeteoraPositionTransaction,
): MeteoraPositionTransaction {
  const {
    mintX: mintY,
    mintY: mintX,
    mintXDecimals: mintYDecimals,
    mintYDecimals: mintXDecimals,
    symbolX: symbolY,
    symbolY: symbolX,
    mintXBalanceChange: mintYBalanceChange,
    mintYBalanceChange: mintXBalanceChange,
    balanceChangeValue,
    mintXFeesClaimed: mintYFeesClaimed,
    mintYFeesClaimed: mintXFeesClaimed,
    claimedFeesValue: feesValue,
    isInverted,
    price,
  } = transaction;

  const symbols = transaction.pairName.split("-");
  const pairName = `${symbols[1]}-${symbols[0]}`;

  return {
    ...transaction,
    pairName,
    mintX,
    mintY,
    mintXDecimals,
    mintYDecimals,
    symbolX,
    symbolY,
    mintXBalanceChange,
    mintYBalanceChange,
    balanceChangeValue: balanceChangeValue
      ? Math.floor(
          (mintXBalanceChange / price! + mintYBalanceChange) *
            10 ** mintYDecimals,
        ) /
        10 ** mintYDecimals
      : 0,
    mintXFeesClaimed,
    mintYFeesClaimed,
    claimedFeesValue: feesValue
      ? Math.floor(
          (mintXFeesClaimed / price! + mintYFeesClaimed) * 10 ** mintYDecimals,
        ) /
        10 ** mintYDecimals
      : 0,
    price: price
      ? Math.floor(10 ** mintYDecimals / price) / 10 ** mintYDecimals
      : null,
    isInverted: !isInverted,
  };
}

function hasSinglePosition(positions: MeteoraPositionTransaction[]) {
  const uniquePositionAddresses = unique(
    positions.map((position) => position.position),
  );

  return uniquePositionAddresses.length == 1;
}

export class MeteoraPosition {
  position: string;
  lbPair: string;
  sender: string;
  pairName: string;
  mintX: string;
  mintY: string;
  mintXDecimals: number;
  mintYDecimals: number;
  reward1Mint: null | string;
  reward2Mint: null | string;
  symbolX: string;
  symbolY: string;
  symbolReward1: null | string;
  symbolReward2: null | string;
  isClosed: boolean;
  isHawksight: boolean;
  transactions: MeteoraPositionTransaction[] = [];
  transactionCount = 0;
  openTimestampMs = 0;
  closeTimestampMs = 0;
  totalXDeposits = 0;
  totalYDeposits = 0;
  usdTotalXDeposits: null | number = null;
  usdTotalYDeposits: null | number = null;
  totalOpenXBalance = 0;
  totalOpenYBalance = 0;
  usdTotalOpenXBalance: null | number = null;
  usdTotalOpenYBalance: null | number = null;
  depositCount = 0;
  totalXWithdraws = 0;
  totalYWithdraws = 0;
  usdTotalXWithdraws: null | number = null;
  usdTotalYWithdraws: null | number = null;
  withdrawCount = 0;
  netXDepositsAndWithdraws = 0;
  netYDepositsAndWithdraws = 0;
  totalClaimedXFees = 0;
  totalClaimedYFees = 0;
  totalClaimedFeesValue = 0;
  usdClaimedXFees: null | number = null;
  usdClaimedYFees: null | number = null;
  totalUnclaimedXFees = 0;
  totalUnclaimedYFees = 0;
  usdTotalUnclaimedXFees: null | number = null;
  usdTotalUnclaimedYFees: null | number = null;
  totalXFees = 0;
  totalYFees = 0;
  usdTotalXFees: null | number = null;
  usdTotalYFees: null | number = null;
  feeClaimCount = 0;
  totalReward1 = 0;
  totalReward2 = 0;
  usdTotalReward1: null | number = null;
  usdTotalReward2: null | number = null;
  rewardClaimClount = 0;
  inverted: boolean;
  isOneSided = false;
  hasNoIl = false;
  hasNoFees = false;
  depositsValue = 0;
  hasApiError: null | boolean = null;
  usdDepositsValue: null | number = null;
  withdrawsValue = 0;
  usdWithdrawsValue: null | number = null;
  netDepositsAndWithdrawsValue = 0;
  usdNetDepositsAndWithdrawsValue: null | number = null;
  openBalanceValue = 0;
  claimedFeesValue = 0;
  unclaimedFeesValue = 0;
  totalFeesValue = 0;
  profitLossValue = 0;
  usdOpenBalanceValue: null | number = null;
  usdClaimedFeesValue: null | number = null;
  usdUnclaimedFeesValue: null | number = null;
  usdTotalFeesValue: null | number = null;
  usdProfitLossValue: null | number = null;

  constructor(transactions: MeteoraPositionTransaction[]) {
    if (!hasSinglePosition(transactions)) {
      throw new Error(
        "MeteoraPosition construtor expects an array of transactions for a single position.  Multiple positions were passed in.",
      );
    }
    const {
      position,
      lbPair,
      sender,
      pairName,
      mintX,
      mintY,
      mintXDecimals,
      mintYDecimals,
      reward1Mint,
      reward2Mint,
      symbolX,
      symbolY,
      isHawksight,
      symbolReward1,
      symbolReward2,
    } = transactions[0];

    this.position = position;
    this.lbPair = lbPair;
    this.sender = sender;
    this.pairName = pairName;
    this.mintX = mintX;
    this.mintY = mintY;
    this.mintXDecimals = mintXDecimals;
    this.mintYDecimals = mintYDecimals;
    this.reward1Mint = reward1Mint;
    this.reward2Mint = reward2Mint;
    this.symbolX = symbolX;
    this.symbolY = symbolY;
    this.symbolReward1 = symbolReward1;
    this.symbolReward2 = symbolReward2;
    this.isClosed = transactions
      .map((transaction) => transaction.close)
      .reduce((final, current) => final || current);
    this.isHawksight = isHawksight;
    this.transactions = transactions.sort(meteoraPositionTransactionSorter);
    this.inverted = transactions[0].isInverted;
    this.updateValues();
  }

  floorX(num: number): number {
    return (
      Math.floor(num * 10 ** this.mintXDecimals) / 10 ** this.mintXDecimals
    );
  }

  floorY(num: number): number {
    return (
      Math.floor(num * 10 ** this.mintYDecimals) / 10 ** this.mintYDecimals
    );
  }

  updateValues(calcUsd = false) {
    this.summarizeTransactions();
    this.calcTotals();
    this.calcPrices();
    if (calcUsd) {
      this.calcUsd();
    }
  }

  summarizeTransactions() {
    summarize(
      this.transactions,
      {
        transactionCount: {
          summaryMethod: "count",
          filter: (transaction) => transaction.add,
        },
        totalXDeposits: {
          key: "mintXBalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.add,
        },
        totalYDeposits: {
          key: "mintYBalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.add,
        },
        openTimestampMs: {
          key: "timestamp_ms",
          summaryMethod: "first",
        },
        withdrawCount: {
          summaryMethod: "count",
          filter: (transaction) => transaction.remove,
        },
        totalXWithdraws: {
          key: "mintXBalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.remove,
        },
        totalYWithdraws: {
          key: "mintYBalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.remove,
        },
        totalOpenXBalance: {
          key: "mintXOpenBalance",
          summaryMethod: "sum",
        },
        totalOpenYBalance: {
          key: "mintYOpenBalance",
          summaryMethod: "sum",
        },
        closeTimestampMs: {
          key: "timestamp_ms",
          summaryMethod: "last",
          filter: (transaction) =>
            this.isClosed ? transaction.remove : transaction.add,
        },
        feeClaimCount: {
          summaryMethod: "count",
          filter: (transaction) => transaction.claim,
        },
        totalClaimedXFees: {
          key: "mintXFeesClaimed",
          summaryMethod: "sum",
        },
        totalClaimedYFees: {
          key: "mintYFeesClaimed",
          summaryMethod: "sum",
        },
        totalUnclaimedXFees: {
          key: "mintXUnclaimedFees",
          summaryMethod: "sum",
        },
        totalUnclaimedYFees: {
          key: "mintYUnclaimedFees",
          summaryMethod: "sum",
        },
        rewardClaimClount: {
          summaryMethod: "count",
          filter: (transaction) => transaction.reward,
        },
        totalReward1: {
          key: "reward1BalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.reward,
        },
        totalReward2: {
          key: "reward2BalanceChange",
          summaryMethod: "sum",
          filter: (transaction) => transaction.reward,
        },
      },
      this,
    );
  }

  calcTotals() {
    this.netXDepositsAndWithdraws = this.floorX(
      this.totalXDeposits + this.totalXWithdraws,
    );
    this.netYDepositsAndWithdraws = this.floorY(
      this.totalYDeposits + this.totalYWithdraws,
    );
    this.totalXFees = this.floorX(
      this.totalClaimedXFees + this.totalUnclaimedXFees,
    );
    this.totalYFees = this.floorX(
      this.totalClaimedYFees + this.totalUnclaimedYFees,
    );
    this.isOneSided = this.totalXDeposits == 0 || this.totalYDeposits == 0;
    this.hasNoIl =
      this.isOneSided &&
      this.netXDepositsAndWithdraws >= 0 &&
      this.netYDepositsAndWithdraws >= 0;
    this.hasNoFees = this.totalXFees + this.totalYFees == 0;
  }

  calcPrices() {
    summarize(
      this.transactions,
      {
        depositsValue: {
          key: "balanceChangeValue",
          summaryMethod: "sum",
          filter: (transaction) => transaction.add,
          postProcess: (value) => this.floorY(value),
        },
        withdrawsValue: {
          key: "balanceChangeValue",
          summaryMethod: "sum",
          filter: (transaction) => transaction.remove,
          postProcess: (value) => this.floorY(value),
        },
        openBalanceValue: {
          key: "openBalanceValue",
          summaryMethod: "sum",
          postProcess: (value) => this.floorY(value),
        },
        claimedFeesValue: {
          key: "claimedFeesValue",
          summaryMethod: "sum",
          postProcess: (value) => this.floorY(value),
        },
        unclaimedFeesValue: {
          key: "unclaimedFeesValue",
          summaryMethod: "sum",
          postProcess: (value) => this.floorY(value),
        },
        totalFeesValue: {
          summaryMethod: "sum",
          expression: (transaction) =>
            transaction.claimedFeesValue + transaction.unclaimedFeesValue,
          postProcess: (value) => this.floorY(value),
        },
      },
      this,
    );
    this.netDepositsAndWithdrawsValue = this.floorY(
      this.depositsValue + this.withdrawsValue,
    );
    this.profitLossValue = this.floorY(
      this.netDepositsAndWithdrawsValue +
        this.totalFeesValue +
        this.openBalanceValue,
    );
  }

  calcUsd() {
    if (!this.hasApiError) {
      summarize(
        this.transactions,
        {
          usdTotalXDeposits: {
            summaryMethod: "sum",
            key: "usdMintXBalanceChange",
            filter: (transaction) => transaction.add,
          },
          usdTotalYDeposits: {
            summaryMethod: "sum",
            key: "usdMintYBalanceChange",
            filter: (transaction) => transaction.add,
          },
          usdTotalXWithdraws: {
            summaryMethod: "sum",
            key: "usdMintXBalanceChange",
            filter: (transaction) => transaction.remove,
          },
          usdTotalYWithdraws: {
            summaryMethod: "sum",
            key: "usdMintYBalanceChange",
            filter: (transaction) => transaction.remove,
          },
          usdTotalOpenXBalance: {
            summaryMethod: "sum",
            key: "usdMintXOpenBalance",
          },
          usdTotalOpenYBalance: {
            summaryMethod: "sum",
            key: "usdMintYOpenBalance",
          },
          usdClaimedXFees: {
            summaryMethod: "sum",
            key: "usdMintXFeesClaimed",
          },
          usdClaimedYFees: {
            summaryMethod: "sum",
            key: "usdMintYFeesClaimed",
          },
          usdTotalUnclaimedXFees: {
            summaryMethod: "sum",
            key: "usdMintXUnclaimedFees",
          },
          usdTotalUnclaimedYFees: {
            summaryMethod: "sum",
            key: "usdMintYUnclaimedFees",
          },
          usdTotalReward1: {
            summaryMethod: "sum",
            key: "usdReward1BalanceChange",
          },
          usdTotalReward2: {
            summaryMethod: "sum",
            key: "usdReward2BalanceChange",
          },
        },
        this,
      );
      this.usdDepositsValue = this.usdTotalXDeposits! + this.usdTotalYDeposits!;
      this.usdWithdrawsValue =
        this.usdTotalXWithdraws! + this.usdTotalYWithdraws!;
      this.usdClaimedFeesValue = this.usdClaimedXFees! + this.usdClaimedYFees!;
      this.usdUnclaimedFeesValue =
        this.usdTotalUnclaimedXFees! + this.usdTotalUnclaimedYFees!;
      this.usdTotalXFees = this.usdClaimedXFees! + this.usdTotalUnclaimedXFees!;
      this.usdTotalYFees = this.usdClaimedYFees! + this.usdTotalUnclaimedYFees!;
      this.usdTotalFeesValue = this.usdTotalXFees + this.usdTotalYFees;
      this.usdNetDepositsAndWithdrawsValue =
        this.usdDepositsValue + this.usdWithdrawsValue;
      this.usdOpenBalanceValue =
        this.usdTotalOpenXBalance! + this.usdTotalOpenYBalance!;
      this.usdProfitLossValue =
        this.usdNetDepositsAndWithdrawsValue +
        this.usdTotalFeesValue +
        this.usdOpenBalanceValue;
    }
  }
}
