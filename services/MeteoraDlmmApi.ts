import { cachedRequest, type UnifiedFetcher } from "./util";
import * as _decimaljs2 from "decimal.js";

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
