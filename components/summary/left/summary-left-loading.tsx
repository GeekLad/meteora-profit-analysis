import { Card, CardBody, Progress } from "@nextui-org/react";
import MeteoraDownloaderStream from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { LoadingItem } from "@/components/loading-status-item";
import { getDurationString } from "@/services/util";

export const SummaryLeftLoading = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloaderStream;
}) => {
  const loadingTransactions =
    !props.downloader.positionsComplete &&
    !props.downloader.stats.transactionDownloadCancelled;

  const loadingUsd =
    props.downloader.downloadComplete &&
    !props.downloader.stats.transactionDownloadCancelled;

  return (
    <Card className="md:m-4 sm:mb-4">
      <CardBody>
        <LoadingItem
          title="Time Elapsed"
          value={getDurationString(
            props.downloader.stats.secondsElapsed * 1000,
          )}
        />
        <LoadingItem
          hidden={loadingUsd}
          title="Estimated Completion"
          value="TODO: Put ETA"
        />
        <LoadingItem
          hidden={!loadingTransactions}
          loading={loadingTransactions}
          title="# of New Wallet Transactions"
          value={props.downloader.stats.accountSignatureCount}
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
              ? props.downloader.stats.positionTransactionCount
              : props.data.positionTransactionCount
          }
        />
        <LoadingItem
          loading={loadingTransactions}
          title={loadingTransactions ? "# of New Positions" : "# of Positions"}
          value={
            loadingTransactions
              ? props.downloader.stats.positionCount
              : props.data.positionCount
          }
        />
        <LoadingItem
          loading={!props.downloader.positionsComplete}
          title={
            loadingTransactions
              ? "# of Pos. updated w/ USD"
              : "# of Pos. Missing USD"
          }
          value={
            loadingTransactions
              ? props.downloader.stats.usdPositionCount
              : props.downloader.stats.missingUsd
          }
        />
        {props.downloader.downloadComplete ? (
          <></>
        ) : (
          <Progress
            aria-label="Loading progress"
            isIndeterminate={
              !props.downloader.positionsComplete &&
              !props.downloader.stats.transactionDownloadCancelled
            }
            showValueLabel={true}
            value={
              (100 *
                (Math.max(
                  props.data.positionCount,
                  props.downloader.stats.positionCount,
                ) -
                  props.downloader.stats.missingUsd)) /
              Math.max(
                props.data.positionCount,
                props.downloader.stats.positionCount,
              )
            }
          />
        )}
      </CardBody>
    </Card>
  );
};
