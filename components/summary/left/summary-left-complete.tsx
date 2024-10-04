import { Card, CardBody } from "@nextui-org/react";
import MeteoraDownloaderStream from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { LoadingItem } from "@/components/loading-status-item";
import { getDurationString } from "@/services/util";

export const SummaryLeftComplete = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloaderStream;
}) => {
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
          loading={false}
          title={"# of Position Transactions"}
          value={props.data.positionTransactionCount}
        />
        <LoadingItem
          loading={false}
          title={"# of Positions"}
          value={props.data.positionCount}
        />
      </CardBody>
    </Card>
  );
};
