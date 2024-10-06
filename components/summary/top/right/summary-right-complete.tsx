import { Card, CardBody } from "@nextui-org/react";
import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { LoadingItem } from "@/components/loading-status-item";
import { SummaryData } from "@/components/summary/generate-summary";

export const SummaryRightComplete = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloader;
  cancel: () => any;
}) => {
  if (
    props.done ||
    props.downloader.stats.transactionDownloadCancelled ||
    props.downloader.stats.positionsComplete
  ) {
    return (
      <Card className="self-start">
        <CardBody>
          <LoadingItem
            loading={!props.done}
            title="Estimated Points from Fees"
            value={(props.data.usdFees * 1000).toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              },
            )}
          />
          <LoadingItem
            loading={!props.done}
            title="Total Fees in USD"
            value={props.data.usdFees.toLocaleString(
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
            loading={!props.done}
            title="Total Impermanent Loss in USD"
            value={props.data.usdImpermanentLoss.toLocaleString(
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
            loading={!props.done}
            title="Total USD Profit"
            value={props.data.usdProfit.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              },
            )}
          />
        </CardBody>
      </Card>
    );
  }

  return <></>;
};
