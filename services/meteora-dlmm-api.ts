import pThrottle from "p-throttle";

import {
  METEORA_API,
  METEORA_API_PAIR_ENDPOINT,
  METEORA_API_POSITION_ENDPOINT,
} from "./config";
import { UnifiedFetcher, cachedRequest } from "./util";

export interface MeteoraPositionData {
  address: string;
  pair_address: string;
  owner: string;
  total_fee_x_claimed: number;
  total_fee_y_claimed: number;
  total_reward_x_claimed: number;
  total_reward_y_claimed: number;
  total_fee_usd_claimed: number;
  total_reward_usd_claimed: number;
  fee_apy_24h: number;
  fee_apr_24h: number;
  daily_fee_yield: number;
}

export interface MeteoraTransactionData {
  tx_id: string;
  position_address: string;
  pair_address: string;
  active_bin_id: number;
  token_x_amount: number;
  token_y_amount: number;
  price: number;
  token_x_usd_amount: number;
  token_y_usd_amount: number;
  onchain_timestamp: number;
}

export interface MeteoraClaimFeesData {
  active_bin_id: number;
  onchain_timestamp: number;
  pair_address: string;
  position_address: string;
  price: number;
  token_x_amount: number;
  token_x_usd_amount: number;
  token_y_amount: number;
  token_y_usd_amount: number;
  tx_id: string;
}

export interface MeteoraClaimRewardsData {
  onchain_timestamp: number;
  pair_address: string;
  position_address: string;
  reward_mint_address: string;
  token_amount: number;
  token_usd_amount: number;
  tx_id: string;
}

export interface MeteoraPositionWithTransactions {
  position: MeteoraPositionData;
  deposits: MeteoraTransactionData[];
  withdraws: MeteoraTransactionData[];
}

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

export const THROTTLE_METEORA_SUMMARY_API = pThrottle({
  limit: 2,
  interval: 1000,
  strict: true,
});

export const THROTTLE_METEORA_DETAIL_API = pThrottle({
  limit: 4,
  interval: 1000,
  strict: true,
});

const fetchPosition = THROTTLE_METEORA_SUMMARY_API((positionAddress: string) =>
  fetch(METEORA_API + METEORA_API_POSITION_ENDPOINT + "/" + positionAddress),
);
const fetchDeposits = THROTTLE_METEORA_DETAIL_API((positionAddress: string) =>
  fetch(
    METEORA_API +
      METEORA_API_POSITION_ENDPOINT +
      "/" +
      positionAddress +
      "/deposits",
  ),
);
const fetchWithdraws = THROTTLE_METEORA_DETAIL_API((positionAddress: string) =>
  fetch(
    METEORA_API +
      METEORA_API_POSITION_ENDPOINT +
      "/" +
      positionAddress +
      "/withdraws",
  ),
);
const fetchClaimFees = THROTTLE_METEORA_DETAIL_API((positionAddress: string) =>
  fetch(
    METEORA_API +
      METEORA_API_POSITION_ENDPOINT +
      "/" +
      positionAddress +
      "/claim_fees",
  ),
);
const fetchClaimRewards = THROTTLE_METEORA_DETAIL_API(
  (positionAddress: string) =>
    fetch(
      METEORA_API +
        METEORA_API_POSITION_ENDPOINT +
        "/" +
        positionAddress +
        "/claim_rewards",
    ),
);

export async function getPositionData(
  positionAddress: string,
): Promise<MeteoraPositionWithTransactions | undefined> {
  const positionResponse: Response = await fetchPosition(positionAddress);

  if (positionResponse.status == 500) {
    console.warn(`Position ${positionAddress} not found`);

    return undefined;
  }

  if (positionResponse.status == 429) {
    const errMsg = `Throttled while loading ${positionAddress}`;

    console.error(errMsg);
    throw new Error(errMsg);
  }

  try {
    const position =
      (await positionResponse.json()) as unknown as MeteoraPositionData;

    return getPositionDetails(position);
  } catch (err) {
    console.warn(`Position ${positionAddress} not found`);
    console.error(err);

    return undefined;
  }
}

async function getPositionDetails(position: MeteoraPositionData) {
  const [depositsResponse, withdrawsResponse] = await Promise.all([
    fetchDeposits(position.address),
    fetchWithdraws(position.address),
  ]);

  const [deposits, withdraws] = await Promise.all([
    depositsResponse.json() as unknown as MeteoraTransactionData[],
    withdrawsResponse.json() as unknown as MeteoraTransactionData[],
  ]);

  return {
    position,
    deposits,
    withdraws,
  };
}

export const getPairs = cachedRequest(
  async (fetcher: UnifiedFetcher = fetch) => {
    const pairResponse = await fetcher(METEORA_API + METEORA_API_PAIR_ENDPOINT);
    const pairs = JSON.parse(await pairResponse.text()) as MeteoraDlmmPair[];

    return {
      lastUpdated: new Date().getTime(),
      pairs,
    };
  },
);

export async function getPairData(
  pairAddress: string,
  fetcher: UnifiedFetcher = fetch,
) {
  const pairs = await getPairs(fetcher);

  return pairs.pairs.find((pair) => pair.address == pairAddress)!;
}
