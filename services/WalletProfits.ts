import { JupiterTokenListToken } from "./JupiterTokenList";
import { MeteoraPosition } from "./MeteoraPosition";
import PairGroupProfits from "./PairGroupProfits";
import QuoteTokenProfit from "./QuoteTokenProfits";
import { summarize, unique } from "./util";

export default class WalletProfits {
  tokenProfits: QuoteTokenProfit[] = [];
  quoteTokenCount!: number;
  pairGroupCount!: number;
  positionCount!: number;

  constructor(
    positions: MeteoraPosition[],
    tokenMap: Map<string, JupiterTokenListToken>,
  ) {
    const baseTokenAddresses = unique(
      positions.map((position) => position.mintX),
    );
    const quoteTokenAddresses = unique(
      positions.map((position) => position.mintY),
    );
    const baseTokens = baseTokenAddresses.map(
      (tokenAddress) => tokenMap.get(tokenAddress)!,
    );
    const quoteTokens = quoteTokenAddresses.map(
      (tokenAddress) => tokenMap.get(tokenAddress)!,
    );

    quoteTokens.forEach((quoteToken) => {
      const quoteTokenPairGroupProfits: PairGroupProfits[] = [];

      baseTokens.forEach((baseToken) => {
        const matchingPositions = positions.filter(
          (position) =>
            position.mintX == baseToken.address &&
            position.mintY == quoteToken.address,
        );

        if (matchingPositions.length > 0) {
          quoteTokenPairGroupProfits.push(
            new PairGroupProfits(matchingPositions, baseToken, quoteToken),
          );
        }
      });

      this.tokenProfits.push(new QuoteTokenProfit(quoteTokenPairGroupProfits));
    });

    this.tokenProfits = this.tokenProfits.sort(
      (a, b) => b.positionCount - a.positionCount,
    );

    summarize(
      this.tokenProfits,
      {
        quoteTokenCount: {
          summaryMethod: "count",
        },
        pairGroupCount: {
          summaryMethod: "sum",
          key: "pairGroupCount",
        },
        positionCount: {
          summaryMethod: "sum",
          key: "positionCount",
        },
      },
      this,
    );
  }
}
