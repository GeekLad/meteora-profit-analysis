import { JupiterTokenListToken } from "./JupiterTokenList";
import { MeteoraPosition } from "./MeteoraPosition";
import { summarize } from "./util";

export default class PairGroupProfits {
  baseToken: JupiterTokenListToken;
  quoteToken: JupiterTokenListToken;
  positions: MeteoraPosition[];
  positionCount!: number;
  transactionCount!: number;
  totalProfit!: number;
  divergenceLoss!: number;
  totalFees!: number;

  constructor(
    positions: MeteoraPosition[],
    baseToken: JupiterTokenListToken,
    quoteToken: JupiterTokenListToken,
  ) {
    this.baseToken = baseToken;
    this.quoteToken = quoteToken;
    this.positions = positions;
    summarize(
      this.positions,
      {
        positionCount: {
          summaryMethod: "count",
        },
        transactionCount: {
          summaryMethod: "sum",
          key: "transactionCount",
        },
        totalProfit: {
          summaryMethod: "sum",
          key: "profitLossValue",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
        totalFees: {
          summaryMethod: "sum",
          key: "totalFeesValue",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
        divergenceLoss: {
          summaryMethod: "sum",
          expression: (position) =>
            position.profitLossValue - position.totalFeesValue,
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
      },
      this,
    );
  }
}
