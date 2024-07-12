import pThrottle from "p-throttle";

import { cachedRequest, delay, type UnifiedFetcher } from "./util";

const METEORA_API = "https://dlmm-api.meteora.ag";
const METEORA_API_PAIR_ENDPOINT = "/pair/all";

export interface MeteoraDlmmPair {
  address: string;
  name: string;
  mint_x: string;
  mint_y: string;
  reserve_x: string;
  reserve_y: string;
  reserve_x_amount: number;
  reserve_y_amount: number;
  bin_step: number;
  base_fee_percentage: string;
  max_fee_percentage: string;
  protocol_fee_percentage: string;
  liquidity: string;
  reward_mint_x: string;
  reward_mint_y: string;
  fees_24h: number;
  today_fees: number;
  trade_volume_24h: number;
  cumulative_trade_volume: string;
  cumulative_fee_volume: string;
  current_price: number;
  apr: number;
  apy: number;
  farm_apr: number;
  farm_apy: number;
  hide: boolean;
}

export interface MeteoraApidata {
  tx_id: string;
  onchain_timestamp: number;
  position_address: string;
  pair_address: string;
}

export interface MeteoraTransactionData extends MeteoraApidata {
  active_bin_id: number;
  price: number;
  token_x_amount: number;
  token_y_amount: number;
  token_x_usd_amount: number;
  token_y_usd_amount: number;
}

export interface MeteoraClaimFeesData extends MeteoraApidata {
  token_x_amount: number;
  token_x_usd_amount: number;
  token_y_amount: number;
  token_y_usd_amount: number;
}

export interface MeteoraClaimRewardsData extends MeteoraApidata {
  reward_mint_address: string;
  token_amount: number;
  token_usd_amount: number;
}

export const getDlmmPairs = cachedRequest(
  async (fetcher: UnifiedFetcher = fetch) => {
    const pairResponse = await fetcher(METEORA_API + METEORA_API_PAIR_ENDPOINT);
    const pairArray = JSON.parse(
      await pairResponse.text(),
    ) as MeteoraDlmmPair[];
    const pairs: Map<string, MeteoraDlmmPair> = new Map();

    pairArray.forEach((pair) => pairs.set(pair.address, pair));

    return {
      lastUpdated: new Date().getTime(),
      pairs,
    };
  },
);

export const THROTTLE_METEORA_DETAIL_API = pThrottle({
  limit: 4,
  interval: 1000,
  strict: true,
});

const fetchMeteoraApiData = THROTTLE_METEORA_DETAIL_API(
  async (
    positionAddress: string,
    endpoint: "/deposits" | "/withdraws" | "/claim_fees" | "/claim_rewards",
    delayMs = 1000,
  ): Promise<any> => {
    const url = `${METEORA_API}/position/${positionAddress}${endpoint}`;
    const response = await fetch(url);

    if (response.status == 429) {
      await delay(delayMs);

      return fetchMeteoraApiData(positionAddress, endpoint, delayMs * 2);
    }

    return response.json();
  },
);

export async function fetchDeposits(positionAddress: string) {
  return fetchMeteoraApiData(positionAddress, "/deposits") as Promise<
    MeteoraTransactionData[]
  >;
}

export async function fetchWithdraws(positionAddress: string) {
  return fetchMeteoraApiData(positionAddress, "/withdraws") as Promise<
    MeteoraTransactionData[]
  >;
}

export async function fetchFees(positionAddress: string) {
  return fetchMeteoraApiData(positionAddress, "/claim_fees") as Promise<
    MeteoraClaimFeesData[]
  >;
}

export async function fetchRewards(positionAddress: string) {
  return fetchMeteoraApiData(positionAddress, "/claim_rewards") as Promise<
    MeteoraClaimRewardsData[]
  >;
}
