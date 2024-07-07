import { JupiterTokenListToken } from "./JupiterTokenList";
import PairGroupProfits from "./PairGroupProfits";
import { summarize } from "./util";

export interface CumulativeProfitDataPoint {
  "Position Close Date": string;
  "Cumulative Profit": number;
}

export interface TokenProfitDataPoint {
  Symbol: string;
  "Total Profit": number;
}

export default class QuoteTokenProfit {
  quoteToken: JupiterTokenListToken;
  pairGroupProfits: PairGroupProfits[];
  pairGroupCount!: number;
  positionCount!: number;
  totalProfit!: number;
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
        totalProfit: {
          summaryMethod: "sum",
          key: "totalProfit",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
      },
      this,
    );

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
        "Total Profit": pairGroup.totalProfit,
      };
    });
  }
}
