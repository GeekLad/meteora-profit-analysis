import { JUPITER_PRICE_API } from "./config";
import { getPriceFromSwapApi } from "./jupiter-swap-api";
import { cachedRequest } from "./util";

export interface JupiterPriceResponse {
  data: {
    [symbol: string]: JupiterPrice;
  };
  timeTaken: number;
}

export interface JupiterPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export const getPrice = cachedRequest(
  async (token: string, decimals: number): Promise<JupiterPrice> => {
    const response = await fetch(JUPITER_PRICE_API + token);
    const responseJson = (await response.json()) as JupiterPriceResponse;

    if (token in responseJson.data) {
      return responseJson.data[token];
    }

    const swapQuote = await getPriceFromSwapApi(token, decimals);

    return {
      id: token,
      mintSymbol: "UNKNOWN",
      vsToken: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
      vsTokenSymbol: "USDC",
      price: Number(swapQuote.outAmount) / 10 ** 6,
    };
  },
);
