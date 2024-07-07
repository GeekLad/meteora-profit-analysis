import { cachedRequest, type UnifiedFetcher } from "./util";

const JUPITER_TOKEN_STRICT_LIST_API = "https://token.jup.ag/strict";
const JUPITER_TOKEN_ALL_LIST_API = "https://token.jup.ag/all";

export interface JupiterTokenListToken {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags: JupiterTokenListTag[];
  extensions?: JupiterTokenListExtensions;
}

interface JupiterTokenListExtensions {
  coingeckoId?: string;
  isBanned?: boolean;
}

enum JupiterTokenListTag {
  Community = "community",
  OldRegistry = "old-registry",
  SolanaFm = "solana-fm",
  Token2022 = "token-2022",
  Unknown = "unknown",
  Wormhole = "wormhole",
}

export const getJupiterTokenList = cachedRequest(
  async (
    fetcher: UnifiedFetcher = fetch,
    listType: "all" | "strict" = "all",
  ): Promise<Map<string, JupiterTokenListToken>> => {
    const url =
      listType == "strict"
        ? JUPITER_TOKEN_STRICT_LIST_API
        : JUPITER_TOKEN_ALL_LIST_API;

    const response = await fetcher(url);
    const responseText = await response.text();

    const tokenList = JSON.parse(responseText) as JupiterTokenListToken[];
    const tokenMap: Map<string, JupiterTokenListToken> = new Map();

    tokenList.forEach((token) => tokenMap.set(token.address, token));

    return tokenMap;
  },
);
