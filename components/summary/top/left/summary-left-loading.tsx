import { Card, CardBody, Progress } from "@nextui-org/react";
import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { LoadingItem } from "@/components/loading-status-item";
import { getDurationString } from "@/services/util";

export const SummaryLeftLoading = (props: {
  duration: number;
  done: boolean;
  data: SummaryData;
  stats: MeteoraDlmmDownloaderStats;
}) => {
  const loadingTransactions =
    !props.stats.positionsComplete && !props.stats.transactionDownloadCancelled;

  return (
    <Card>
      <CardBody>
        <LoadingItem
          title="Time Elapsed"
          value={getDurationString(props.duration)}
        />
        <LoadingItem
          hidden={!loadingTransactions}
          loading={loadingTransactions}
          title="# of New Wallet Transactions"
          value={props.stats.accountSignatureCount}
        />
        <LoadingItem
          loading={loadingTransactions}
          title={
            loadingTransactions
              ? "# of New Position Transactions"
              : "# of Position Transactions"
          }
          value={
            loadingTransactions
              ? props.stats.positionTransactionCount
              : props.data.positionTransactionCount
          }
        />
        <LoadingItem
          loading={loadingTransactions}
          title={loadingTransactions ? "# of New Positions" : "# of Positions"}
          value={
            loadingTransactions
              ? props.stats.positionCount
              : props.data.positionCount
          }
        />
        <LoadingItem
          loading={!props.stats.positionsComplete}
          title={
            loadingTransactions
              ? "# of Pos. updated w/ USD"
              : "# of Pos. Missing USD"
          }
          value={
            loadingTransactions
              ? props.stats.usdPositionCount
              : props.stats.missingUsd
          }
        />
        {props.stats.downloadingComplete ? (
          <></>
        ) : (
          <Progress
            aria-label="Loading progress"
            isIndeterminate={
              !props.stats.positionsComplete &&
              !props.stats.transactionDownloadCancelled
            }
            showValueLabel={true}
            value={
              (100 *
                (Math.max(props.data.positionCount, props.stats.positionCount) -
                  props.stats.missingUsd)) /
              Math.max(props.data.positionCount, props.stats.positionCount)
            }
          />
        )}
      </CardBody>
    </Card>
  );
};
