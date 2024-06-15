import { JUPITER_SWAP_API } from "./config";
import { cachedRequest } from "./util";

export interface JupiterSwapQuote {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: null;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

export interface RoutePlan {
  swapInfo: SwapInfo;
  percent: number;
}

export interface SwapInfo {
  ammKey: string;
  label: string;
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  feeAmount: string;
  feeMint: string;
}

export const getPriceFromSwapApi = cachedRequest(
  async (inputMint: string, decimals: number): Promise<JupiterSwapQuote> => {
    const response = await fetch(
      JUPITER_SWAP_API +
        "/quote?inputMint=" +
        inputMint +
        "&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=" +
        10 ** decimals +
        "&slippageBps=50",
    );

    return response.json() as Promise<JupiterSwapQuote>;
  },
);
