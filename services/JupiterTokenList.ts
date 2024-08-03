import pThrottle from "p-throttle";

import { throttledCachedRequest, type UnifiedFetcher } from "./util";
import tokens from "./tokens.json";

const JUPITER_ALL_TOKENS_API = "https://tokens.jup.ag/tokens";
const JUPITER_SINGLE_TOKEN_API = "https://tokens.jup.ag/token/";

export interface JupiterTokenListToken {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: string[];
  daily_volume: number;
}

const JUPITER_TOKEN_LIST_API_THROTTLE = pThrottle({
  limit: 1,
  interval: 2500,
  strict: true,
});

export async function getFullJupiterTokenList() {
  const response = await fetch(JUPITER_ALL_TOKENS_API);
  const responseText = await response.text();

  return JSON.parse(responseText) as JupiterTokenListToken[];
}

export function getCachedJupiterTokenList() {
  const map: Map<string, JupiterTokenListToken> = new Map();

  (tokens as JupiterTokenListToken[]).forEach((token) =>
    map.set(token.address, token),
  );

  return map;
}

export const getJupiterTokenListToken = throttledCachedRequest(
  async (
    address: string,
    fetcher: UnifiedFetcher = fetch,
  ): Promise<JupiterTokenListToken | undefined> => {
    const url = JUPITER_SINGLE_TOKEN_API + address;

    const response = await fetcher(url);
    const responseText = await response.text();

    if (responseText == "null") {
      return undefined;
    }

    return JSON.parse(responseText) as JupiterTokenListToken;
  },
  JUPITER_TOKEN_LIST_API_THROTTLE,
);
