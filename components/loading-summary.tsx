import { Card, CardBody, Progress } from "@nextui-org/react";

import { LoadingItem } from "./loading-status-item";
import { MissingTransactionsDownloadButton } from "./missing-transactions-download-button";
import { AllPositionsDownloadButton } from "./all-positions-download-button";
import { ValidPositionsDownloadButton } from "./valid-positions-download-button";
import { MetricCard } from "./metric-card";

import { PositionLoadingState } from "@/pages";

export const LoadingSummary = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  return (
    <div className="md:flex w-auto">
      <Card className="md:m-4 md:w-1/2 sm:w-full">
        <CardBody>
          <LoadingItem
            title="Time Elapsed"
            value={props.positionLoadingState.durationString}
          />
          {props.loading &&
          props.positionLoadingState.eta &&
          props.positionLoadingState.eta != "" ? (
            <LoadingItem
              title="Estimated time to complete"
              value={props.positionLoadingState.eta}
            />
          ) : (
            ""
          )}
          <LoadingItem
            loading={!props.positionLoadingState.allSignaturesFound}
            title="# of Transactions Found"
            value={props.positionLoadingState.signatureCount}
          />
          <LoadingItem
            loading={!props.positionLoadingState.allPositionsFound}
            title="# of Positions Found"
            value={props.positionLoadingState.positionAddresses.length}
          />
          <LoadingItem
            loading={props.loading}
            title="# of Positions w/ Errors"
            value={
              props.positionLoadingState.profits.filter(
                (profit) => profit.errors.length > 0,
              ).length
            }
          />
          <LoadingItem
            loading={props.loading}
            title="# of Positions Analyzed"
            value={props.positionLoadingState.profits.length}
          />
          {!props.positionLoadingState.done ? (
            <Progress
              className="mt-4"
              isIndeterminate={!props.positionLoadingState.allPositionsFound}
              showValueLabel={props.positionLoadingState.allPositionsFound}
              value={props.positionLoadingState.positionProgress}
            />
          ) : (
            <></>
          )}
        </CardBody>
      </Card>
      <div className="w-2/3 h-full">
        <div className="md:flex">
          <MetricCard
            label={"Fee Points"}
            value={
              props.positionLoadingState.userProfit.fee_points +
              props.positionLoadingState.userProfit.reward_points
            }
          />
          <MetricCard
            label={"Balance Points"}
            value={props.positionLoadingState.userProfit.balance_points}
          />
          <MetricCard
            label={"Total Points"}
            value={props.positionLoadingState.userProfit.total_points}
          />
        </div>
        <div className="md:flex justify-end items-end">
          <MissingTransactionsDownloadButton
            positionAddresses={props.positionLoadingState.positionAddresses}
            profits={props.positionLoadingState.profits}
          />
          <ValidPositionsDownloadButton
            profits={props.positionLoadingState.profits}
          />
          <AllPositionsDownloadButton
            profits={props.positionLoadingState.profits}
          />
        </div>
      </div>
    </div>
  );
};
