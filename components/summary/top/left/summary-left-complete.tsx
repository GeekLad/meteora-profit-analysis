import { Card, CardBody } from "@nextui-org/react";
import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { LoadingItem } from "@/components/loading-status-item";

export const SummaryLeftComplete = (props: {
  done: boolean;
  data: SummaryData;
  stats: MeteoraDlmmDownloaderStats;
}) => {
  return (
    <Card>
      <CardBody>
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
        <LoadingItem
          loading={false}
          title={"First Transaction"}
          value={props.data.startDate.toLocaleDateString()}
        />
        <LoadingItem
          loading={false}
          title={"Most Recent Transaction"}
          value={props.data.endDate.toLocaleDateString()}
        />
      </CardBody>
    </Card>
  );
};
