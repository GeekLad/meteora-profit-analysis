import { LoadingSummaryLeft } from "./loading-summary-left";
import { LoadingSummaryNoUsd } from "./loading-summary-no-usd";
import { LoadingSummaryUsd } from "./loading-summary-usd";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";
import { MeteoraPosition } from "@/services/MeteoraPosition";

export const LoadingSummary = (props: {
  filteredPositions: MeteoraPosition[];
  loading: boolean;
  positionLoadingState: PositionLoadingState;
  usd: boolean;
}) => {
  const filteredTransactions = props.filteredPositions
    .map((position) => position.transactions)
    .flat();

  const updatedUsdValueCount = props.filteredPositions.filter(
    (position) => position.hasApiError !== null,
  ).length;
  const usdFeesAndRewards =
    filteredTransactions.length == 0
      ? 0
      : filteredTransactions
          .map(
            (transaction) =>
              Number(transaction.usdClaimedFeesValue) +
              Number(transaction.usdUnclaimedFeesValue) +
              Number(transaction.usdReward1BalanceChange) +
              Number(transaction.usdReward2BalanceChange) +
              Number(transaction.usdReward1UnclaimedBalance) +
              Number(transaction.usdReward2UnclaimedBalance),
          )
          .reduce((total, current) => total + current);
  const estimatedPointsFromFeesAndRewards = usdFeesAndRewards * 1000;
  const positionsWithoutErrors = props.filteredPositions.filter(
    (position) => position.hasApiError === false,
  );
  const usdDivergenceLoss =
    positionsWithoutErrors.length == 0
      ? 0
      : positionsWithoutErrors
          .map(
            (position) =>
              Number(position.usdNetDepositsAndWithdrawsValue) +
              Number(position.usdOpenBalanceValue),
          )
          .reduce((total, current) => total + current);

  const usdProfit =
    positionsWithoutErrors.length == 0
      ? 0
      : positionsWithoutErrors
          .map((position) => Number(position.usdProfitLossValue))
          .reduce((total, current) => total + current);
  const positionsWithErrorsCount = props.filteredPositions.filter(
    (position) => position.hasApiError,
  ).length;

  return (
    <div className="md:grid grid-flow-cols grid-cols-2 items-end">
      <LoadingSummaryLeft
        filteredPositions={props.filteredPositions}
        filteredTransactions={filteredTransactions}
        loading={props.loading}
        positionLoadingState={props.positionLoadingState}
        updatedUsdValueCount={updatedUsdValueCount}
        usd={props.usd}
      />
      <LoadingSummaryNoUsd positionLoadingState={props.positionLoadingState} />
      <LoadingSummaryUsd
        estimatedPointsFromFeesAndRewards={estimatedPointsFromFeesAndRewards}
        positionLoadingState={props.positionLoadingState}
        positionsWithErrorsCount={positionsWithErrorsCount}
        usdDivergenceLoss={usdDivergenceLoss}
        usdFeesAndRewards={usdFeesAndRewards}
        usdProfit={usdProfit}
      />
    </div>
  );
};
