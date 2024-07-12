import { Card, CardBody, Progress } from "@nextui-org/react";

import { LoadingItem } from "./loading-status-item";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const LoadingSummary = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
  usd: boolean;
}) => {
  const usdFeesAndRewards =
    props.positionLoadingState.transactions.length == 0
      ? 0
      : props.positionLoadingState.transactions
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
  const positionsWithoutErrors = props.positionLoadingState.positions.filter(
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
  const positionsWithErrorsCount = props.positionLoadingState.positions.filter(
    (position) => position.hasApiError,
  ).length;

  return (
    <div className="md:grid grid-flow-cols grid-cols-2 items-end">
      <Card className="md:m-4 sm:mb-4">
        <CardBody>
          <LoadingItem
            title="Time Elapsed"
            value={props.positionLoadingState.durationString}
          />
          <LoadingItem
            hidden={props.positionLoadingState.apiDataLoaded}
            title="Estimated Completion"
            value={
              props.positionLoadingState.estimatedCompletionString == ""
                ? "Calculating..."
                : props.positionLoadingState.estimatedCompletionString
            }
          />
          <LoadingItem
            loading={!props.positionLoadingState.allSignaturesFound}
            title="# of Wallet Transactions"
            value={props.positionLoadingState.signatureCount}
          />
          <LoadingItem
            loading={
              !props.positionLoadingState.allPositionsFound &&
              !props.positionLoadingState.rpcDataLoaded
            }
            title={"# of Position Transactions"}
            value={props.positionLoadingState.transactionCount}
          />
          <LoadingItem
            loading={
              !props.positionLoadingState.allPositionsFound &&
              !props.positionLoadingState.rpcDataLoaded
            }
            title={"# of Positions"}
            value={props.positionLoadingState.positions.length}
          />
          <LoadingItem
            hidden={
              props.positionLoadingState.openPositionCount == 0 ||
              !props.positionLoadingState.updatingOpenPositions
            }
            loading={props.positionLoadingState.updatingOpenPositions}
            title="Updating Open Positions"
          />
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="# of Pos. updated w/ USD"
            value={props.positionLoadingState.updatedUsdValueCount}
          />
          {props.positionLoadingState.apiDataLoaded ? (
            <></>
          ) : (
            <Progress
              aria-label="Loading progress"
              isIndeterminate={
                !props.positionLoadingState.apiDataLoaded &&
                props.positionLoadingState.estimatedCompletionString == ""
              }
              showValueLabel={true}
              value={props.positionLoadingState.updatedUsdPercent}
            />
          )}
        </CardBody>
      </Card>
      <Card className="md:m-4 sm:mb-4 self-start">
        <CardBody>
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="Estimated Points from Fees"
            value={estimatedPointsFromFeesAndRewards.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="Total Fees in USD"
            value={usdFeesAndRewards.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="Total Divergence Loss in USD"
            value={usdDivergenceLoss.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="Total USD Profit"
            value={usdProfit.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
          <LoadingItem
            loading={!props.positionLoadingState.apiDataLoaded}
            title="# of Pos. w/ API Errors"
            value={positionsWithErrorsCount.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              },
            )}
          />
        </CardBody>
      </Card>
    </div>
  );
};
