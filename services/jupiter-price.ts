import { JUPITER_PRICE_API } from "./config";
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
  async (token: string): Promise<JupiterPrice> => {
    const response = await fetch(JUPITER_PRICE_API + token);
    const responseJson = (await response.json()) as JupiterPriceResponse;

    return responseJson.data[token];
  },
);
