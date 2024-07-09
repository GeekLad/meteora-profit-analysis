import { JupiterTokenListToken } from "./JupiterTokenList";
import PairGroupProfits from "./PairGroupProfits";
import { summarize } from "./util";

export interface CumulativeProfitDataPoint {
  "Position Close Date": string;
  "Cumulative Profit": number;
}

export interface TokenProfitDataPoint {
  Symbol: string;
  Fees: number;
  "Fees in USD": null | number;
  "Rewards in USD": null | number;
  "Divergence Loss": number;
  "Divergence Loss in USD": null | number;
  "Total Profit": number;
  "Total Profit in USD": null | number;
}

export default class QuoteTokenProfit {
  quoteToken: JupiterTokenListToken;
  pairGroupProfits: PairGroupProfits[];
  pairGroupCount!: number;
  positionCount!: number;
  transactionCount!: number;
  totalProfit!: number;
  usdTotalProfit: null | number = null;
  totalFees!: number;
  usdTotalFees: null | number = null;
  usdTotalRewards: null | number = null;
  divergenceLoss: number;
  usdDivergenceLoss: null | number = null;
  cumulativeProfit: CumulativeProfitDataPoint[] = [];
  tokenProfit: TokenProfitDataPoint[];

  constructor(pairGroupProfits: PairGroupProfits[]) {
    this.quoteToken = pairGroupProfits[0].quoteToken;
    this.pairGroupProfits = pairGroupProfits.sort(
      (a, b) => b.totalProfit - a.totalProfit,
    );

    summarize(
      pairGroupProfits,
      {
        pairGroupCount: {
          summaryMethod: "count",
        },
        positionCount: {
          summaryMethod: "sum",
          key: "positionCount",
        },
        transactionCount: {
          summaryMethod: "sum",
          key: "transactionCount",
        },
        totalProfit: {
          summaryMethod: "sum",
          key: "totalProfit",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
        totalFees: {
          summaryMethod: "sum",
          key: "totalFees",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
      },
      this,
    );

    this.divergenceLoss =
      Math.floor(
        (this.totalProfit - this.totalFees) * 10 ** this.quoteToken.decimals,
      ) /
      10 ** this.quoteToken.decimals;

    const positions = pairGroupProfits
      .map((pairGroupSummary) => pairGroupSummary.positions)
      .flat()
      .sort((a, b) => a.closeTimestampMs - b.closeTimestampMs);

    positions.forEach((position, index) => {
      if (index == 0) {
        this.cumulativeProfit.push({
          "Position Close Date": new Date(
            position.closeTimestampMs,
          ).toLocaleDateString(),
          "Cumulative Profit": position.profitLossValue,
        });
      } else {
        this.cumulativeProfit.push({
          "Position Close Date": new Date(
            position.closeTimestampMs,
          ).toLocaleDateString(),
          "Cumulative Profit":
            Math.floor(
              (this.cumulativeProfit[index - 1]["Cumulative Profit"] +
                position.profitLossValue) *
                10 ** this.quoteToken.decimals,
            ) /
            10 ** this.quoteToken.decimals,
        });
      }
    });

    this.tokenProfit = this.pairGroupProfits.map((pairGroup) => {
      return {
        Symbol: pairGroup.baseToken.symbol,
        Fees: pairGroup.totalFees,
        "Fees in USD": null,
        "Rewards in USD": null,
        "Divergence Loss": pairGroup.divergenceLoss,
        "Divergence Loss in USD": null,
        "Total Profit": pairGroup.totalProfit,
        "Total Profit in USD": null,
      };
    });
  }
}
