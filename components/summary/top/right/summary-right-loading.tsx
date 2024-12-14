import { Button, Card, CardBody } from "@nextui-org/react";
import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";
import { useState } from "react";

import { SummaryData } from "../../generate-summary";

export const SummaryRightLoading = (props: {
  done: boolean;
  data: SummaryData;
  stats: MeteoraDlmmDownloaderStats;
  cancel: () => any;
}) => {
  const [cancelling, setCancelling] = useState(false);

  if (
    !props.stats.oldestTransactionDate ||
    props.stats.positionsComplete ||
    cancelling
  ) {
    return <div className="md:m-4 sm:mb-4 self-start">&nbsp;</div>;
  }

  return (
    <Card className="self-start">
      <CardBody>
        <p className="mb-4">
          <b>Oldest position transaction:</b>{" "}
          {props.stats.oldestTransactionDate!.toLocaleDateString() +
            " " +
            props.stats.oldestTransactionDate!.toLocaleTimeString()}
        </p>
        <p className="mb-4">
          If you know you have no DLMM transactions prior to the date above or
          you do not want to analyze older transactions/positions, you can stop
          searching for DLMM transactions.
        </p>
        <Button
          className="w-half mb-4"
          color="danger"
          onPress={() => {
            setCancelling(true);
            props.cancel();
          }}
        >
          Stop Loading Wallet Transactions
        </Button>
      </CardBody>
    </Card>
  );
};
