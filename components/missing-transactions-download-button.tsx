import { Button } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import { MeteoraPositionProfit } from "@/services/profit-downloader";
import { downloadStringToFile } from "@/services/util";

export const MissingTransactionsDownloadButton = (props: {
  positionAddresses: string[];
  profits: MeteoraPositionProfit[];
}) => {
  if (props.profits.length == 0) {
    return <></>;
  }

  const identifiedPositionAddresses = props.profits.map(
    (position) => position.position.address,
  );
  const missingTransactions = props.positionAddresses.filter(
    (positionAddress) => !identifiedPositionAddresses.includes(positionAddress),
  );

  if (missingTransactions.length == 0) {
    return <></>;
  }

  const onClick = () => {
    downloadStringToFile(
      "missing-transactions.csv",
      "tx_id\n" + missingTransactions.join("\n"),
    );
  };

  return (
    <Button
      aria-label="Download Missing Transactions"
      className="m-4"
      color="primary"
      startContent={<DownloadIcon />}
      onClick={() => onClick()}
    >
      Download Missing Transactions
    </Button>
  );
};
