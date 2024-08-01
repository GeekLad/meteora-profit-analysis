import { Card, CardBody } from "@nextui-org/react";

import { LoadingItem } from "./loading-status-item";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const LoadingSummaryUsd = (props: {
  positionLoadingState: PositionLoadingState;
  estimatedPointsFromFeesAndRewards: number;
  usdFeesAndRewards: number;
  usdDivergenceLoss: number;
  usdProfit: number;
  positionsWithErrorsCount: number;
}) => {
  return (
    <Card
      className={`md:m-4 sm:mb-4 self-start  ${props.positionLoadingState.updatingUsdValues ? "" : "hidden"}`}
    >
      <CardBody>
        <LoadingItem
          loading={!props.positionLoadingState.apiDataLoaded}
          title="Estimated Points from Fees"
          value={props.estimatedPointsFromFeesAndRewards.toLocaleString(
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
          value={props.usdFeesAndRewards.toLocaleString(
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
          value={props.usdDivergenceLoss.toLocaleString(
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
          value={props.usdProfit.toLocaleString(
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
          value={props.positionsWithErrorsCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            },
          )}
        />
      </CardBody>
    </Card>
  );
};
