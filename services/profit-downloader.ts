import { LbPosition } from "@meteora-ag/dlmm";
import {
  ConfirmedSignatureInfo,
  Connection,
  ParsedTransactionWithMeta,
  PartiallyDecodedInstruction,
} from "@solana/web3.js";

import {
  getAllSignaturesForAddress,
  getDlmmAndUserPositions,
  getParsedTransactions,
  getPositionAddressesFromSignature,
} from "./connection";
import {
  MeteoraPositionWithTransactions,
  getPositionData,
  MeteoraDlmmPair,
  MeteoraTransactionData,
  getPairData,
} from "./meteora-dlmm-api";
import { lamportsToUsd } from "./jupiter-token-list";
import { METEORA_PROGRAM_ID } from "./config";
import { total, max } from "./util";

interface MeteoraPositionMints {
  mintX: string;
  mintY: string;
  reward1Mint: string | null;
  reward2Mint: string | null;
}

interface MeteoraPairGroupName {
  group_name: string;
  group_id: string;
}

interface MeteoraPairName extends MeteoraPairGroupName {
  name: string;
}

interface MeteoraPositionWithTransactionMintsAndLbPosition
  extends MeteoraPositionWithTransactions {
  pair_name: MeteoraPairName;
  mints: MeteoraPositionMints;
  lbPosition?: LbPosition;
}

interface MeteoraCurrentValueData {
  current_usd: number;
  unclaimed_fees_usd: number;
  unclaimed_rewards_usd: number;
}

interface MeteoraSummaryData {
  deposit_count: number;
  deposits_usd: number;
  withdraws_count: number;
  withdraws_usd: number;
  claimed_fees_usd: number;
  claimed_rewards_usd: number;
  most_recent_deposit_withdraw: number;
}

interface MeteoraPositionSummaryData extends MeteoraSummaryData {
  is_closed?: boolean;
  errors: string[];
}

interface MeteoraBalanceChange {
  tx_id: string;
  transaction_type: "deposit" | "withdraw";
  timestamp_ms: number;
  balance_change_usd: number;
}

interface MeteoraBalance {
  tx_id_balance_start: string;
  tx_id_balance_end: string | null;
  timestamp_ms_balance_start: number;
  timestamp_ms_balance_end: number;
  balance_age_ms: number;
  transaction_type: "deposit" | "withdraw";
  balance_change_usd: number;
  balance_usd: number;
}

interface MeteoraBalanceSummaryData {
  balance_time_sum_product: number;
  total_time: number;
  total_time_days: number;
  average_balance: number;
}

interface MeteoraProfitData {
  position_profit: number;
  total_profit: number;
  total_fees_rewards_usd: number;
  withdraws_and_current_usd: number;
  fee_points: number;
  reward_points: number;
  balance_points: number;
  total_points: number;
}

export interface MeteoraPositionProfit
  extends MeteoraPositionWithTransactionMintsAndLbPosition,
    MeteoraPositionSummaryData,
    MeteoraCurrentValueData,
    MeteoraBalanceSummaryData,
    MeteoraProfitData {
  balances: MeteoraBalance[];
}

interface MeteoraPositionGroup
  extends MeteoraSummaryData,
    MeteoraCurrentValueData,
    MeteoraBalanceSummaryData,
    MeteoraProfitData {
  name: MeteoraPairGroupName;
  pair_address: string;
  positions: MeteoraPositionProfit[];
  openPositions: MeteoraPositionProfit[];
  positionsWithErrors: MeteoraPositionProfit[];
  position_count: number;
}

export interface MeteoraPairGroup
  extends MeteoraSummaryData,
    MeteoraCurrentValueData,
    MeteoraBalanceSummaryData,
    MeteoraProfitData {
  name: MeteoraPairGroupName;
  position_groups: MeteoraPositionGroup[];
  position_count: number;
  pair_count: number;
}

export interface MeteoraUserProfit
  extends MeteoraSummaryData,
    MeteoraCurrentValueData,
    MeteoraBalanceSummaryData,
    MeteoraProfitData {
  pair_groups: MeteoraPairGroup[];
  pair_group_count: number;
  pair_count: number;
  position_count: number;
}

function nameIsReversed(symbol1: string, symbol2: string) {
  // If SOL, USDC, or USDT is the first symbol, it may be reversed
  if (["SOL", "USDC", "USDT"].includes(symbol1)) {
    if (symbol1 == "SOL") {
      // If USDC or USDT is the second symbol, it's not reversed
      if (["USDC", "USDT"].includes(symbol2)) {
        return false;
      }

      // For anything else, SOL should be the quote symbol, so it's reversed
      return true;
    }

    // If we have a pair with USDC and USDT, check to see if it's reversed
    if (
      ["USDC", "USDT"].includes(symbol1) &&
      ["USDC", "USDT"].includes(symbol2)
    ) {
      // If USDT is first, it's reversed
      if (symbol1 == "USDT") {
        return true;
      }

      // USDT isn't first, it's not reversed
      return false;
    }

    // If both symbols aren't USDC  & USDT, it's reversed
    return true;
  }

  // First symbol isn't SOL, USDC, or USDC, so it's not reversed
  return false;
}

function getPairName(pairInfo: MeteoraDlmmPair): MeteoraPairName {
  const [symbol1, symbol2] = pairInfo.name.split("-");

  const name = pairInfo.name;
  const reversedName = `${symbol2}-${symbol1}`;
  const group_name = nameIsReversed(symbol1, symbol2) ? reversedName : name;
  const group_id = [pairInfo.mint_x, pairInfo.mint_y]
    .sort((a, b) => (a < b ? 0 : 1))
    .join("");

  return {
    name,
    group_name,
    group_id,
  };
}

function getPositionMints(poolInfo: MeteoraDlmmPair): MeteoraPositionMints {
  return {
    mintX: poolInfo.mint_x,
    mintY: poolInfo.mint_y,
    reward1Mint:
      poolInfo.reward_mint_x == "11111111111111111111111111111111"
        ? null
        : poolInfo.reward_mint_x,
    reward2Mint:
      poolInfo.reward_mint_y == "11111111111111111111111111111111"
        ? null
        : poolInfo.reward_mint_y,
  };
}

function getSummaryData(
  position: MeteoraPositionWithTransactionMintsAndLbPosition,
  deposits: MeteoraTransactionData[],
  withdraws: MeteoraTransactionData[],
): MeteoraPositionSummaryData {
  const deposit_count = deposits.length;
  const deposits_usd =
    deposits.length == 0
      ? 0
      : deposits
          .map((tx) => tx.token_x_usd_amount + tx.token_y_usd_amount)
          .reduce((total, current) => total + current);
  const withdraws_count = withdraws.length;
  const withdraws_usd =
    withdraws.length == 0
      ? 0
      : withdraws
          .map((tx) => tx.token_x_usd_amount + tx.token_y_usd_amount)
          .reduce((total, current) => total + current);

  const errors: string[] = [];

  if (deposit_count == 0) {
    errors.push("No deposits found");
  }
  if (deposits_usd == 0) {
    errors.push("Deposits sum to 0 USD");
  }
  if (withdraws_count > 0 && withdraws_usd == 0) {
    errors.push("Withdraws sum to 0 USD");
  }
  const most_recent_deposit_withdraw = Math.max(
    ...deposits
      .map((deposit) => deposit.onchain_timestamp * 1000)
      .concat(withdraws.map((withdraw) => withdraw.onchain_timestamp * 1000)),
  );

  return {
    deposit_count,
    deposits_usd,
    withdraws_count,
    withdraws_usd,
    claimed_fees_usd: position.position.total_fee_usd_claimed,
    claimed_rewards_usd: position.position.total_reward_usd_claimed,
    most_recent_deposit_withdraw,
    errors,
  };
}

function getBalances(
  deposits: MeteoraTransactionData[],
  withdraws: MeteoraTransactionData[],
) {
  const balanceChanges: MeteoraBalanceChange[] = deposits
    .map((tx) => {
      return {
        tx_id: tx.tx_id,
        transaction_type: "deposit",
        timestamp_ms: tx.onchain_timestamp * 1000,
        balance_change_usd: tx.token_x_usd_amount + tx.token_y_usd_amount,
      } as MeteoraBalanceChange;
    })
    .concat(
      withdraws.map((tx) => {
        return {
          tx_id: tx.tx_id,
          transaction_type: "withdraw",
          timestamp_ms: tx.onchain_timestamp * 1000,
          balance_change_usd: -tx.token_x_usd_amount - tx.token_y_usd_amount,
        };
      }),
    )
    .sort((a, b) => a.timestamp_ms - b.timestamp_ms);

  const balances: MeteoraBalance[] = [];
  let priorBalance: MeteoraBalance | undefined = undefined;

  for (let i = 0; i < balanceChanges.length; i++) {
    let currentTx = balanceChanges[i];
    let nextTx = i + 1 < balanceChanges.length ? balanceChanges[i + 1] : null;
    let newBalance: MeteoraBalance = {
      tx_id_balance_start: currentTx.tx_id,
      tx_id_balance_end: nextTx ? nextTx.tx_id : null,
      timestamp_ms_balance_start: currentTx.timestamp_ms,
      timestamp_ms_balance_end: nextTx
        ? nextTx.timestamp_ms
        : currentTx.timestamp_ms,
      balance_age_ms: 0,
      transaction_type: currentTx.transaction_type,
      balance_change_usd: currentTx.balance_change_usd,
      balance_usd: priorBalance
        ? priorBalance.balance_usd + currentTx.balance_change_usd
        : currentTx.balance_change_usd,
    };

    newBalance.balance_age_ms =
      newBalance.timestamp_ms_balance_end -
      newBalance.timestamp_ms_balance_start;
    balances.push(newBalance);
    priorBalance = newBalance;
  }

  return balances;
}

async function getCurrentValue(
  connection: Connection,
  positionWithMintsAndLbPosition: MeteoraPositionWithTransactionMintsAndLbPosition,
  balances: MeteoraBalance[],
): Promise<MeteoraCurrentValueData> {
  const lbPosition = positionWithMintsAndLbPosition.lbPosition;

  if (lbPosition) {
    const lastBalance = balances[balances.length - 1];

    lastBalance.timestamp_ms_balance_end = new Date().getTime();
    lastBalance.balance_age_ms =
      lastBalance.timestamp_ms_balance_end -
      lastBalance.timestamp_ms_balance_start;

    const { mintX, mintY, reward1Mint, reward2Mint } =
      positionWithMintsAndLbPosition.mints;

    const [x, y, x_fees, y_fees, reward1, reward2] = await Promise.all([
      lamportsToUsd(
        connection,
        mintX,
        Number(lbPosition.positionData.totalXAmount),
      ),
      lamportsToUsd(
        connection,
        mintY,
        Number(lbPosition.positionData.totalYAmount),
      ),
      lamportsToUsd(connection, mintX, Number(lbPosition.positionData.feeX)),
      lamportsToUsd(connection, mintY, Number(lbPosition.positionData.feeY)),
      !reward1Mint
        ? 0
        : lamportsToUsd(
            connection,
            reward1Mint,
            Number(lbPosition.positionData.rewardOne),
          ),
      !reward2Mint
        ? 0
        : lamportsToUsd(
            connection,
            reward2Mint,
            Number(lbPosition.positionData.rewardOne),
          ),
    ]);

    return {
      current_usd: x + y,
      unclaimed_fees_usd: x_fees + y_fees,
      unclaimed_rewards_usd: reward1 + reward2,
    };
  }

  return {
    current_usd: 0,
    unclaimed_fees_usd: 0,
    unclaimed_rewards_usd: 0,
  };
}

function getBalanceSummary(
  balances: MeteoraBalance[],
  summaryData: MeteoraSummaryData,
  currentValue: MeteoraCurrentValueData,
): MeteoraBalanceSummaryData & MeteoraProfitData {
  const { withdraws_usd, deposits_usd, claimed_fees_usd, claimed_rewards_usd } =
    summaryData;
  const { current_usd, unclaimed_fees_usd, unclaimed_rewards_usd } =
    currentValue;
  const balance_time_sum_product =
    balances.length == 0
      ? 0
      : balances
          .map((balance) => balance.balance_usd * balance.balance_age_ms)
          .reduce((total, current) => total + current);

  const total_time =
    balances.length == 0
      ? 0
      : balances
          .map((balance) => balance.balance_age_ms)
          .reduce((total, current) => total + current);

  const total_time_days = total_time / (1000 * 60 * 60 * 24);
  const average_balance =
    total_time == 0 ? 0 : balance_time_sum_product / total_time;
  const balance_points = average_balance * total_time_days;
  const withdraws_and_current_usd = withdraws_usd + current_usd;
  const total_fees_rewards_usd =
    claimed_fees_usd +
    unclaimed_fees_usd +
    claimed_rewards_usd +
    unclaimed_rewards_usd;
  const fee_points = 1000 * (claimed_fees_usd + unclaimed_fees_usd);
  const reward_points = 1000 * (claimed_rewards_usd + unclaimed_rewards_usd);
  const total_points = balance_points + fee_points + reward_points;
  const position_profit = withdraws_usd + current_usd - deposits_usd;
  const total_profit =
    position_profit +
    claimed_fees_usd +
    claimed_rewards_usd +
    unclaimed_fees_usd +
    unclaimed_rewards_usd;

  return {
    balance_time_sum_product,
    total_time,
    total_time_days,
    average_balance,
    position_profit,
    total_profit,
    balance_points,
    withdraws_and_current_usd,
    total_fees_rewards_usd,
    fee_points,
    reward_points,
    total_points,
  };
}

async function finalizePositionData(
  connection: Connection,
  positionWithMintsAndLbPosition: MeteoraPositionWithTransactionMintsAndLbPosition,
): Promise<MeteoraPositionProfit> {
  const { deposits, withdraws } = positionWithMintsAndLbPosition;

  const summaryData = getSummaryData(
    positionWithMintsAndLbPosition,
    deposits,
    withdraws,
  );
  const balances = getBalances(deposits, withdraws);

  const currentValue = await getCurrentValue(
    connection,
    positionWithMintsAndLbPosition,
    balances,
  );
  const balanceSummary = getBalanceSummary(balances, summaryData, currentValue);

  return {
    ...positionWithMintsAndLbPosition,
    ...summaryData,
    ...currentValue,
    balances,
    ...balanceSummary,
  };
}

export async function getPositionProfit(
  connection: Connection,
  positionAddress: string,
): Promise<MeteoraPositionProfit | undefined> {
  const positionData = await getPositionData(positionAddress);

  if (!positionData) {
    return undefined;
  }

  const pairInfo = await getPairData(positionData.position.pair_address);

  const pair_name = getPairName(pairInfo);
  const mints = getPositionMints(pairInfo);

  const positionWithoutCurrentValue: MeteoraPositionWithTransactionMintsAndLbPosition =
    {
      ...positionData,
      pair_name,
      mints,
    };

  return finalizePositionData(connection, positionWithoutCurrentValue);
}

function hasMeteoraProgram(tx: ParsedTransactionWithMeta) {
  return tx.transaction.message.instructions
    .map((instruction) => {
      return instruction.programId.toBase58() == METEORA_PROGRAM_ID;
    })
    .reduce((total, current) => total || current);
}

function getPosition(instruction: PartiallyDecodedInstruction): {
  positionAddress: string | undefined;
  isClosed: boolean;
} {
  if (instruction.accounts.length !== 8) {
    return { positionAddress: undefined, isClosed: false };
  }

  const accounts = instruction.accounts.map((account) => account.toBase58());

  if (accounts[0] == accounts[3]) {
    return { positionAddress: accounts[1], isClosed: false };
  }

  return { positionAddress: accounts[0], isClosed: true };
}

function getPositionAdressFromParsedTransaction(
  tx: ParsedTransactionWithMeta,
): { positionAddress: string; isClosed: boolean } | undefined {
  if (!hasMeteoraProgram(tx)) {
    return undefined;
  }

  const matches = tx.transaction.message.instructions
    .map((i) => {
      const instruction = i as PartiallyDecodedInstruction;

      if (!instruction.accounts) {
        return undefined;
      }

      return getPosition(instruction);
    })
    .filter((data) => data?.positionAddress);

  if (matches.length == 0) {
    return undefined;
  }

  return matches[0] as { positionAddress: string; isClosed: boolean };
}

async function getMeteoraPositionAddressesFromParsedTransactions(
  parsedTransactions: (ParsedTransactionWithMeta | null)[],
  onPositionAddressFound?: (positionAddress: string) => any,
  onClosedPositionFound?: (positionAddress: string) => any,
): Promise<string[]> {
  const positionAddresses: string[] = [];
  const closedAddresses: string[] = [];

  for (let i = 0; i < parsedTransactions.length; i++) {
    const tx = parsedTransactions[i];

    if (tx) {
      const data = getPositionAdressFromParsedTransaction(tx);

      // await delay(1000);
      if (data) {
        const newAddress = data.positionAddress;

        if (!positionAddresses.includes(newAddress)) {
          positionAddresses.push(newAddress);
          if (onPositionAddressFound) {
            onPositionAddressFound(newAddress);
          }
        }

        if (data.isClosed && !closedAddresses.includes(newAddress)) {
          closedAddresses.push(newAddress);
          if (onClosedPositionFound) {
            onClosedPositionFound(newAddress);
          }
        }
      }
    }
  }

  return positionAddresses;
}

export async function getMeteoraProfitForAccountOrSignature(
  connection: Connection,
  accountOrSignature: string,
  callbacks?: {
    onSignaturesFound?: (signatureCount: number) => any;
    onAllSignaturesFound?: () => any;
    onPositionFound?: (positionAddress: string) => any;
    onClosedPositionFound?: (positionAddress: string) => any;
    onAllPositionsFound?: () => any;
    onProfitAnalyzed?: (
      addressCheckCount: number,
      profit: MeteoraPositionProfit,
    ) => any;
    onOpenPositionUpdated?: (profit: MeteoraPositionProfit) => any;
    onDone?: () => any;
  },
): Promise<MeteoraPositionProfit[]> {
  const allSignatures = [];
  const allPositionAddresses: string[] = [];
  const closedPositionAddresses: string[] = [];
  const allProfits: MeteoraPositionProfit[] = [];
  let signatureCount = 0;
  let signaturesChecked = 0;
  let positionsAnalyzed = 0;
  let allSignaturesFound = false;

  if (accountOrSignature.length == 44 || accountOrSignature.length == 43) {
    await getAllSignaturesForAddress(
      connection,
      accountOrSignature,
      async (signatures) => _processSignatures(signatures),
      () => {
        allSignaturesFound = true;
        if (callbacks?.onAllSignaturesFound) {
          callbacks.onAllSignaturesFound();
        }
        _checkCompletionCallbacks();
      },
    );
  } else {
    const positionAddressesFromSignature =
      await getPositionAddressesFromSignature(connection, accountOrSignature);

    await Promise.all(
      positionAddressesFromSignature.map((positionAddress) => {
        getAllSignaturesForAddress(
          connection,
          positionAddress,
          async (signatures) => _processSignatures(signatures),
        );
      }),
    );
    allSignaturesFound = true;
    if (callbacks?.onAllSignaturesFound) {
      callbacks.onAllSignaturesFound();
    }
    _checkCompletionCallbacks();
  }

  function _processSignatures(signatures: ConfirmedSignatureInfo[]) {
    const validSignatures = signatures.filter(
      (signature) => signature.err == null,
    );

    if (validSignatures.length > 0) {
      const newSignatures = validSignatures.map(
        (signature) => signature.signature,
      );

      allSignatures.push(...newSignatures);

      signatureCount += validSignatures.length;

      if (callbacks?.onSignaturesFound) {
        callbacks.onSignaturesFound(signatureCount);
      }

      _findPositionAddresses(newSignatures);
    }
  }

  async function _findPositionAddresses(signatures: string[]) {
    const parsedTransactions = await getParsedTransactions(
      connection,
      signatures,
    );

    getMeteoraPositionAddressesFromParsedTransactions(
      parsedTransactions,
      (positionAddress) => {
        if (!allPositionAddresses.includes(positionAddress)) {
          allPositionAddresses.push(positionAddress);
          if (callbacks?.onPositionFound) {
            callbacks.onPositionFound(positionAddress);
          }
          _getPositionProfit(positionAddress);
        }
      },
      (positionAddress) => {
        if (!closedPositionAddresses.includes(positionAddress)) {
          closedPositionAddresses.push(positionAddress);
        }
      },
    );
    signaturesChecked += signatures.length;
    _checkCompletionCallbacks();
  }

  async function _getPositionProfit(positionAddress: string) {
    const profit = await getPositionProfit(connection, positionAddress);

    positionsAnalyzed++;
    if (profit) {
      if (callbacks?.onProfitAnalyzed) {
        callbacks.onProfitAnalyzed(positionsAnalyzed, profit);
      }
      allProfits.push(profit);
    }
    _checkCompletionCallbacks();
  }

  async function _checkCompletionCallbacks() {
    _updateClosedPositions();
    if (
      allSignaturesFound &&
      signaturesChecked == allSignatures.length &&
      callbacks?.onAllPositionsFound
    ) {
      callbacks.onAllPositionsFound();
    }
    if (
      allSignaturesFound &&
      signaturesChecked == allSignatures.length &&
      positionsAnalyzed == allPositionAddresses.length
    ) {
      if (callbacks?.onDone) {
        await _updateOpenPositions();
        callbacks.onDone();
      }
    }
  }

  function _updateClosedPositions() {
    allProfits.forEach((profit) => {
      profit.is_closed = closedPositionAddresses.includes(
        profit.position.address,
      );
      if (
        profit.is_closed &&
        profit.withdraws_count == 0 &&
        !profit.errors.includes("Closed position missing withdraws")
      ) {
        profit.errors.push("Closed position missing withdraws");
      }
    });
  }

  async function _updateOpenPositions() {
    const openPositions = allProfits.filter(
      (profit) => profit.is_closed === false,
    );

    await Promise.all(
      openPositions.map(async (position) => {
        const { userPositions } = await getDlmmAndUserPositions(
          connection,
          position.position.pair_address,
          position.position.owner,
        );

        const lbPosition = userPositions.find(
          (lbPosition) =>
            lbPosition.publicKey.toBase58() == position.position.address,
        );

        position.lbPosition = lbPosition;
        if (lbPosition) {
          const updatedPosition = await finalizePositionData(
            connection,
            position,
          );

          const index = allProfits.indexOf(position);

          allProfits[index] = updatedPosition;

          if (callbacks?.onOpenPositionUpdated) {
            callbacks.onOpenPositionUpdated(updatedPosition);
          }
        }
      }),
    );
  }

  return allProfits;
}

function getMeteoraPositionGroups(
  positions: MeteoraPositionProfit[],
): MeteoraPositionGroup[] {
  const pairs: MeteoraPositionGroup[] = [];
  const pairAddresses = positions.map(
    (position) => position.position.pair_address,
  );
  const uniquePairAddresses = Array.from(new Set(pairAddresses));

  uniquePairAddresses.forEach((pairAddress) => {
    const pairPositions = positions.filter(
      (position) => position.position.pair_address == pairAddress,
    );
    const positionsWithoutErrors = pairPositions.filter(
      (position) => position.errors.length == 0,
    );
    const positionsWithErrors = pairPositions.filter(
      (position) => position.errors.length > 0,
    );
    const analyzedPositions = positionsWithoutErrors.filter(
      (position) =>
        position.is_closed == true ||
        (position.is_closed === false && position.lbPosition),
    );
    const unAnalyzedOpenPositions = positionsWithoutErrors.filter(
      (position) => !position.is_closed && !position.lbPosition,
    );

    const balance_time_sum_product = total(
      positionsWithoutErrors,
      "balance_time_sum_product",
    );
    const total_time = total(positionsWithoutErrors, "total_time");
    const fee_points = total(pairPositions, "fee_points");
    const reward_points = total(pairPositions, "reward_points");
    const balance_points = total(analyzedPositions, "balance_points");
    const total_points = fee_points + reward_points + balance_points;

    pairs.push({
      name: pairPositions[0].pair_name,
      pair_address: pairPositions[0].position.pair_address,
      position_count: analyzedPositions.length,
      positions: analyzedPositions,
      openPositions: unAnalyzedOpenPositions,
      positionsWithErrors,
      deposit_count: total(analyzedPositions, "deposit_count"),
      deposits_usd: total(analyzedPositions, "deposits_usd"),
      withdraws_count: total(analyzedPositions, "withdraws_count"),
      withdraws_usd: total(analyzedPositions, "withdraws_usd"),
      claimed_fees_usd: total(pairPositions, "claimed_fees_usd"),
      claimed_rewards_usd: total(pairPositions, "claimed_rewards_usd"),
      most_recent_deposit_withdraw: max(
        pairPositions,
        "most_recent_deposit_withdraw",
      ),
      balance_time_sum_product,
      total_time,
      total_time_days: total(analyzedPositions, "total_time_days"),
      average_balance:
        total_time == 0 ? 0 : balance_time_sum_product / total_time,
      current_usd: total(analyzedPositions, "current_usd"),
      unclaimed_fees_usd: total(analyzedPositions, "unclaimed_fees_usd"),
      unclaimed_rewards_usd: total(analyzedPositions, "unclaimed_rewards_usd"),
      position_profit: total(analyzedPositions, "position_profit"),
      total_profit: total(analyzedPositions, "total_profit"),
      fee_points,
      reward_points,
      balance_points,
      total_points,
      total_fees_rewards_usd: total(
        analyzedPositions,
        "total_fees_rewards_usd",
      ),
      withdraws_and_current_usd: total(
        analyzedPositions,
        "withdraws_and_current_usd",
      ),
    });
  });

  return pairs;
}

export function getMeteoraPairGroups(
  positions: MeteoraPositionProfit[],
): MeteoraPairGroup[] {
  const pairPositions = getMeteoraPositionGroups(positions);
  const groups: MeteoraPairGroup[] = [];
  const groupIds = pairPositions.map((pairRollup) => pairRollup.name.group_id);
  const uniqueGroupIds = Array.from(new Set(groupIds));

  uniqueGroupIds.forEach((groupId) => {
    const pairIdRollups = pairPositions.filter(
      (pairPositions) => pairPositions.name.group_id == groupId,
    );

    const balance_time_sum_product = total(
      pairIdRollups,
      "balance_time_sum_product",
    );
    const total_time = total(pairIdRollups, "total_time");

    groups.push({
      name: pairIdRollups[0].name,
      position_groups: pairIdRollups,
      pair_count: pairIdRollups.length,
      position_count: total(pairIdRollups, "position_count"),
      deposit_count: total(pairIdRollups, "deposit_count"),
      deposits_usd: total(pairIdRollups, "deposits_usd"),
      withdraws_count: total(pairIdRollups, "withdraws_count"),
      withdraws_usd: total(pairIdRollups, "withdraws_usd"),
      claimed_fees_usd: total(pairIdRollups, "claimed_fees_usd"),
      claimed_rewards_usd: total(pairIdRollups, "claimed_rewards_usd"),
      most_recent_deposit_withdraw: max(
        pairIdRollups,
        "most_recent_deposit_withdraw",
      ),
      balance_time_sum_product,
      total_time,
      total_time_days: total(pairIdRollups, "total_time_days"),
      average_balance:
        total_time == 0 ? 0 : balance_time_sum_product / total_time,
      current_usd: total(pairIdRollups, "current_usd"),
      unclaimed_fees_usd: total(pairIdRollups, "unclaimed_fees_usd"),
      unclaimed_rewards_usd: total(pairIdRollups, "unclaimed_rewards_usd"),
      position_profit: total(pairIdRollups, "position_profit"),
      total_profit: total(pairIdRollups, "total_profit"),
      fee_points: total(pairIdRollups, "fee_points"),
      reward_points: total(pairIdRollups, "reward_points"),
      balance_points: total(pairIdRollups, "balance_points"),
      total_points: total(pairIdRollups, "total_points"),
      total_fees_rewards_usd: total(pairIdRollups, "total_fees_rewards_usd"),
      withdraws_and_current_usd: total(
        pairIdRollups,
        "withdraws_and_current_usd",
      ),
    });
  });

  return groups;
}

export function getMeteoraUserProfit(
  positions: MeteoraPositionProfit[],
): MeteoraUserProfit {
  const pair_groups = getMeteoraPairGroups(positions);

  const balance_time_sum_product = total(
    pair_groups,
    "balance_time_sum_product",
  );
  const total_time = total(pair_groups, "total_time");

  return {
    pair_groups,
    pair_group_count: total(pair_groups, "position_groups"),
    pair_count: total(pair_groups, "pair_count"),
    position_count: total(pair_groups, "position_count"),
    deposit_count: total(pair_groups, "deposit_count"),
    deposits_usd: total(pair_groups, "deposits_usd"),
    withdraws_count: total(pair_groups, "withdraws_count"),
    withdraws_usd: total(pair_groups, "withdraws_usd"),
    claimed_fees_usd: total(pair_groups, "claimed_fees_usd"),
    claimed_rewards_usd: total(pair_groups, "claimed_rewards_usd"),
    most_recent_deposit_withdraw: max(
      pair_groups,
      "most_recent_deposit_withdraw",
    ),
    balance_time_sum_product,
    total_time,
    total_time_days: total(pair_groups, "total_time_days"),
    average_balance: total_time ? 0 : balance_time_sum_product / total_time,
    current_usd: total(pair_groups, "current_usd"),
    withdraws_and_current_usd: total(pair_groups, "withdraws_and_current_usd"),
    unclaimed_fees_usd: total(pair_groups, "unclaimed_fees_usd"),
    unclaimed_rewards_usd: total(pair_groups, "unclaimed_rewards_usd"),
    total_fees_rewards_usd: total(pair_groups, "total_fees_rewards_usd"),
    position_profit: total(pair_groups, "position_profit"),
    total_profit: total(pair_groups, "total_profit"),
    fee_points: total(pair_groups, "fee_points"),
    reward_points: total(pair_groups, "reward_points"),
    balance_points: total(pair_groups, "balance_points"),
    total_points: total(pair_groups, "total_points"),
  };
}

export function profitSort<
  T extends MeteoraPairGroup | MeteoraPositionGroup | MeteoraPositionProfit,
>(profits: T[], descending = true) {
  return profits.sort((a, b) =>
    descending
      ? b.total_profit - a.total_profit
      : a.total_profit - b.total_profit,
  );
}

export function sortProfitsByRecentGroupTransactions(
  profits: MeteoraPositionProfit[],
) {
  const groupTimestamps: Map<string, number> = new Map();

  profits.forEach((profit) => {
    const groupId = profit.pair_name.group_id;
    const groupTime = groupTimestamps.get(groupId);

    if (!groupTime) {
      groupTimestamps.set(groupId, profit.most_recent_deposit_withdraw);
    } else {
      if (profit.most_recent_deposit_withdraw > groupTime) {
        groupTimestamps.set(groupId, profit.most_recent_deposit_withdraw);
      }
    }
  });

  return profits.sort(
    (a, b) =>
      groupTimestamps.get(b.pair_name.group_id)! -
        groupTimestamps.get(a.pair_name.group_id)! ||
      b.most_recent_deposit_withdraw - a.most_recent_deposit_withdraw,
  );
}
