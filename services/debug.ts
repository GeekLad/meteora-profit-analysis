import { Connection } from "@solana/web3.js";

import { MeteoraPositionProfit, getPositionProfit } from "./profit-downloader";

export async function getMeteoraProfitForPositionAddress(
  connection: Connection,
  positionAddress: string,
  callbacks?: {
    onSignaturesFound?: (signatureCount: number) => any;
    onAllSignaturesFound?: () => any;
    onPositionsFound?: (positionAddressCount: number) => any;
    onAllPositionsFound?: () => any;
    onProfitAnalyzed?: (
      addressCheckCount: number,
      profit: MeteoraPositionProfit,
    ) => any;
    onDone?: () => any;
  },
): Promise<MeteoraPositionProfit[]> {
  const profit = (await getPositionProfit(
    connection,
    positionAddress,
  )) as MeteoraPositionProfit;

  if (callbacks?.onAllSignaturesFound) callbacks.onAllSignaturesFound();
  if (callbacks?.onAllPositionsFound) callbacks.onAllPositionsFound();
  if (callbacks?.onProfitAnalyzed) callbacks.onProfitAnalyzed(1, profit);
  if (callbacks?.onDone) callbacks.onDone();

  return [profit];
}
