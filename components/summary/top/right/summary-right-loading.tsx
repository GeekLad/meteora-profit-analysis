import { Button, Card, CardBody } from "@nextui-org/react";
import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";
import { useState } from "react";

import { SummaryData } from "../../generate-summary";

export const SummaryRightLoading = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloader;
  cancel: () => any;
}) => {
  const [cancelling, setCancelling] = useState(false);

  if (
    !props.downloader.stats.oldestTransactionDate ||
    props.downloader.positionsComplete
  ) {
    return <div className="md:m-4 sm:mb-4 self-start">&nbsp;</div>;
  }

  return (
    <Card className="self-start">
      <CardBody>
        <p className="mb-4">
          <b>Oldest position transaction:</b>{" "}
          {props.downloader.stats.oldestTransactionDate!.toLocaleDateString() +
            " " +
            props.downloader.stats.oldestTransactionDate!.toLocaleTimeString()}
        </p>
        <p className="mb-4">
          If you know you have no DLMM transactions prior to the date above or
          you do not want to analyze older transactions/positions, you can stop
          searching for DLMM transactions.
        </p>
        <Button
          className="w-half mb-4"
          color="danger"
          onClick={() => {
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
