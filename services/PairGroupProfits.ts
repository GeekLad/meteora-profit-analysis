import { JupiterTokenListToken } from "./JupiterTokenList";
import { MeteoraPosition } from "./MeteoraPosition";
import { summarize } from "./util";

export default class PairGroupProfits {
  baseToken: JupiterTokenListToken;
  quoteToken: JupiterTokenListToken;
  positions: MeteoraPosition[];
  positionCount!: number;
  positionCountWithApiErrors!: number;
  transactionCount!: number;
  totalDeposits!: number;
  totalProfit!: number;
  profitPercent: number;
  profitMissingApiData!: number;
  usdTotalProfit: null | number = null;
  usdProfitPercent: null | number;
  divergenceLoss!: number;
  usdDivergenceLoss: null | number = null;
  totalFees!: number;
  feesMissingApiData!: number;
  usdTotalDeposits: null | number = null;
  usdTotalFees: null | number = null;
  usdTotalRewards: null | number = null;

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
        positionCountWithApiErrors: {
          summaryMethod: "count",
          filter: (position) => position.hasApiError == true,
        },
        transactionCount: {
          summaryMethod: "sum",
          key: "transactionCount",
        },
        totalDeposits: {
          summaryMethod: "sum",
          key: "depositsValue",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
        totalProfit: {
          summaryMethod: "sum",
          key: "profitLossValue",
          postProcess: (value) =>
            Math.floor(value * 10 ** this.quoteToken.decimals) /
            10 ** this.quoteToken.decimals,
        },
        profitMissingApiData: {
          summaryMethod: "sum",
          key: "profitLossValue",
          filter: (position) => position.hasApiError == true,
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
        feesMissingApiData: {
          summaryMethod: "sum",
          key: "totalFeesValue",
          filter: (position) => position.hasApiError == true,
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
        usdTotalDeposits: {
          summaryMethod: "sum",
          key: "usdDepositsValue",
        },
        usdTotalProfit: {
          summaryMethod: "sum",
          key: "usdProfitLossValue",
        },
        usdTotalFees: {
          summaryMethod: "sum",
          key: "usdTotalFeesValue",
        },
        usdTotalRewards: {
          summaryMethod: "sum",
          expression: (position) =>
            position.totalReward1 + position.totalReward2,
        },
      },
      this,
    );
    this.usdDivergenceLoss =
      this.usdTotalProfit! - this.usdTotalFees! - this.usdTotalRewards!;
    this.profitPercent = -this.totalProfit / this.totalDeposits;
    this.usdProfitPercent =
      this.usdTotalProfit && this.usdTotalDeposits
        ? -this.usdTotalProfit / this.usdTotalDeposits
        : null;
  }
}
