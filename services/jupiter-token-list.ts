import { Connection } from "@solana/web3.js";

import { cachedRequest, type UnifiedFetcher } from "./util";
import {
  JUPITER_TOKEN_ALL_LIST_API,
  JUPITER_TOKEN_STRICT_LIST_API,
} from "./config";
import { getParsedAccountInfo } from "./connection";
import { getPrice } from "./jupiter-price";

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

export interface JupiterTokenListExtensions {
  coingeckoId?: string;
  isBanned?: boolean;
}

export enum JupiterTokenListTag {
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
    listType: "all" | "strict",
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

export async function getDecimals(
  connection: Connection,
  address: string,
): Promise<number> {
  const tokenMap = await getJupiterTokenList(fetch, "all");
  const jupiterToken = tokenMap.get(address);

  if (jupiterToken) {
    return jupiterToken.decimals;
  }
  const accountInfo = await getParsedAccountInfo(connection, address);

  if (
    !accountInfo?.value?.data ||
    (accountInfo.value.data && !("parsed" in accountInfo.value.data))
  ) {
    throw new Error(`${address} is not a valid token address!`);
  }

  return accountInfo.value.data.parsed.decimals as number;
}

export async function lamportsToDecimal(
  connection: Connection,
  address: string,
  lamports: number,
): Promise<number> {
  const decimals = await getDecimals(connection, address);

  return lamports / 10 ** decimals;
}

export async function lamportsToUsd(
  connection: Connection,
  address: string,
  lamports: number,
): Promise<number> {
  const decimals =
    // Special case for DED
    address == "7raHqUrZXAqtxFJ2wcmtpH7SQYLeN9447vD4KhZM7tcP"
      ? 6
      : await getDecimals(connection, address);
  const price = await getPrice(address, decimals);

  return (lamports / 10 ** decimals) * price.price;
}
