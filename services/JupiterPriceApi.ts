const JUPITER_PRICE_API = "https://price.jup.ag/v6/price?ids=";

export interface JupiterPriceApiResponse {
  data: Data;
  timeTaken: number;
}

export interface Data {
  [symbol: string]: JupiterPrice;
}

export interface JupiterPrice {
  id: string;
  mintSymbol: string;
  vsToken: string;
  vsTokenSymbol: string;
  price: number;
}

export async function getPrices(
  addresses: string[],
): Promise<Map<string, JupiterPrice>> {
  const queryString = addresses.join(",");
  const response = await fetch(`${JUPITER_PRICE_API}${queryString}`);
  const data = (await response.json()) as JupiterPriceApiResponse;

  const priceMap = new Map<string, JupiterPrice>();

  Object.values(data.data).forEach((price) => priceMap.set(price.id, price));

  return priceMap;
}
