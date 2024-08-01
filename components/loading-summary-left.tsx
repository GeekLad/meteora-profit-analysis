import { Card, CardBody, Progress } from "@nextui-org/react";

import { LoadingItem } from "./loading-status-item";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";
import { MeteoraPosition } from "@/services/MeteoraPosition";
import { MeteoraPositionTransaction } from "@/services/ParseMeteoraTransactions";

export const LoadingSummaryLeft = (props: {
  filteredPositions: MeteoraPosition[];
  filteredTransactions: MeteoraPositionTransaction[];
  loading: boolean;
  positionLoadingState: PositionLoadingState;
  usd: boolean;
  updatedUsdValueCount: number;
}) => {
  return (
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
          value={props.filteredTransactions.length}
        />
        <LoadingItem
          loading={
            !props.positionLoadingState.allPositionsFound &&
            !props.positionLoadingState.rpcDataLoaded
          }
          title={"# of Positions"}
          value={props.filteredPositions.length}
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
          value={props.updatedUsdValueCount}
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
  );
};
