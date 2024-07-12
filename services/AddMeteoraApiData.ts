import {
  fetchDeposits,
  fetchFees,
  fetchRewards,
  fetchWithdraws,
  MeteoraClaimFeesData,
  MeteoraClaimRewardsData,
  MeteoraTransactionData,
} from "./MeteoraDlmmApi";
import { MeteoraPosition } from "./MeteoraPosition";
import { MeteoraPositionTransaction } from "./ParseMeteoraTransactions";

export async function addMeteoraApiData(position: MeteoraPosition) {
  const [deposits, withdraws, fees, rewards] = await Promise.all([
    fetchDeposits(position.position),
    fetchWithdraws(position.position),
    fetchFees(position.position),
    position.reward1Mint
      ? fetchRewards(position.position)
      : ([] as MeteoraClaimRewardsData[]),
  ]);

  position.transactions.forEach((transaction) => {
    const deposit = deposits.find((tx) => tx.tx_id == transaction.signature);

    updateUsdData(transaction, deposit, true);

    const withdraw = withdraws.find((tx) => tx.tx_id == transaction.signature);

    updateUsdData(transaction, withdraw);

    const claim = fees.find((tx) => tx.tx_id == transaction.signature);

    updateUsdData(transaction, claim);

    const reward = rewards.find((tx) => tx.tx_id == transaction.signature);

    updateUsdData(transaction, reward);

    transaction.hasApiError =
      (transaction.add && !deposit) ||
      (transaction.remove && !withdraw) ||
      (transaction.claim && !claim) ||
      (transaction.reward && !reward) ||
      (transaction.usdMintXBalanceChange == 0 &&
        transaction.mintXBalanceChange != 0) ||
      (transaction.usdMintYBalanceChange == 0 &&
        transaction.mintYBalanceChange != 0) ||
      (transaction.usdMintXFeesClaimed == 0 &&
        transaction.mintXFeesClaimed != 0) ||
      (transaction.usdMintYFeesClaimed == 0 &&
        transaction.mintYFeesClaimed != 0) ||
      (transaction.usdReward1BalanceChange == 0 &&
        transaction.reward1BalanceChange != 0) ||
      (transaction.usdReward2BalanceChange == 0 &&
        transaction.reward2BalanceChange != 0);
  });

  position.hasApiError = position.transactions
    .map((tx) => tx.hasApiError)
    .reduce((final, current) => final || current);

  if (!position.hasApiError) {
    position.updateValues(true);
  }
}

function updateUsdTransactionData(
  transaction: MeteoraPositionTransaction,
  transactionData: MeteoraTransactionData,
) {
  transaction.usdPrice = transaction.isInverted
    ? transactionData.token_y_usd_amount /
      (transactionData.token_y_amount / 10 ** transaction.mintXDecimals)
    : transactionData.token_x_usd_amount /
      (transactionData.token_x_amount / 10 ** transaction.mintXDecimals);

  transaction.usdPrice =
    transaction.usdPrice == 0 ||
    transaction.usdPrice == Infinity ||
    isNaN(transaction.usdPrice)
      ? null
      : transaction.usdPrice;

  transaction.usdMintXBalanceChange = transaction.isInverted
    ? transactionData.token_y_usd_amount
    : transactionData.token_x_usd_amount;
  transaction.usdMintYBalanceChange = transaction.isInverted
    ? transactionData.token_x_usd_amount
    : transactionData.token_y_usd_amount;
  transaction.usdBalanceChangeValue =
    transactionData.token_x_usd_amount - transactionData.token_y_usd_amount;
}

function updateUsdClaimData(
  transaction: MeteoraPositionTransaction,
  transactionData: MeteoraClaimFeesData,
) {
  if (
    !transaction.usdPrice &&
    transactionData.token_x_usd_amount &&
    transactionData.token_y_usd_amount
  ) {
    transaction.usdPrice = transaction.isInverted
      ? (10 ** transaction.mintXDecimals * transactionData.token_y_usd_amount) /
        transactionData.token_y_amount
      : (10 ** transaction.mintXDecimals * transactionData.token_x_usd_amount) /
        transactionData.token_x_amount;

    if (transaction.priceIsEstimated) {
      const tokenYPrice = transaction.isInverted
        ? (10 ** transaction.mintYDecimals *
            transactionData.token_x_usd_amount) /
          transactionData.token_x_amount
        : (10 ** transaction.mintYDecimals *
            transactionData.token_y_usd_amount) /
          transactionData.token_y_amount;

      transaction.price =
        Math.floor(
          (10 ** transaction.mintXDecimals * transaction.usdPrice) /
            tokenYPrice,
        ) /
        10 ** transaction.mintXDecimals;

      transaction.claimedFeesValue =
        Math.floor(
          (transaction.price * transaction.mintXFeesClaimed +
            transaction.mintYFeesClaimed) *
            10 ** transaction.mintYDecimals,
        ) /
        10 ** transaction.mintYDecimals;
      transaction.priceIsEstimated = false;
    }
  }
  transaction.usdMintXFeesClaimed = transaction.isInverted
    ? transactionData.token_y_usd_amount
    : transactionData.token_x_usd_amount;
  transaction.usdMintYFeesClaimed = transaction.isInverted
    ? transactionData.token_x_usd_amount
    : transactionData.token_y_usd_amount;
  transaction.usdClaimedFeesValue =
    transactionData.token_x_usd_amount + transactionData.token_y_usd_amount;
}

function updateUsdData(
  transaction: MeteoraPositionTransaction,
  transactionData?:
    | MeteoraTransactionData
    | MeteoraClaimFeesData
    | MeteoraClaimRewardsData,
  add?: boolean,
) {
  if (!transactionData) {
    return;
  }

  if ("active_bin_id" in transactionData) {
    updateUsdTransactionData(transaction, transactionData);
    if (add) {
      transaction.usdMintXBalanceChange! *= -1;
      transaction.usdMintYBalanceChange! *= -1;
      transaction.usdBalanceChangeValue! *= -1;
    }
  }

  if (
    !("active_bin_id" in transactionData) &&
    !("token_amount" in transactionData)
  ) {
    updateUsdClaimData(transaction, transactionData);
  }

  if ("token_amount" in transactionData) {
    // Update rewards
    if (transactionData.reward_mint_address == transaction.reward1Mint) {
      transaction.usdReward1BalanceChange = transactionData.token_usd_amount;
    } else {
      transaction.usdReward2BalanceChange = transactionData.token_usd_amount;
    }
  }
}
