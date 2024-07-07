import { Button } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import { downloadObjArrayAsCsv } from "@/services/util";
import { MeteoraPositionTransaction } from "@/services/ParseMeteoraTransactions";

export const TransactionsDownloadButton = (props: {
  hidden?: boolean;
  transactions: MeteoraPositionTransaction[];
}) => {
  if (props.hidden || props.transactions.length == 0) {
    return <></>;
  }

  const onClick = () => {
    downloadObjArrayAsCsv("transactions.csv", props.transactions, [
      "timestamp_ms",
      "slot",
      "signature",
      "pairName",
      "position",
      "symbolX",
      "symbolY",
      "symbolReward1",
      "symbolReward2",
      "mintX",
      "mintY",
      "reward1Mint",
      "reward2Mint",
      "mintXBalanceChange",
      "mintYBalanceChange",
      "mintXFeesClaimed",
      "mintYFeesClaimed",
      "reward1BalanceChange",
      "reward2BalanceChange",
      "price",
      "open",
      "close",
      "add",
      "remove",
      "balanceChangeValue",
      "openBalanceValue",
      "claimedFeesValue",
      "unclaimedFeesValue",
      "totalFeesValue",
    ]);
  };

  return (
    <Button
      aria-label="Download Transactions"
      className="m-4"
      color="primary"
      startContent={<DownloadIcon />}
      onClick={() => onClick()}
    >
      Download Transactions
    </Button>
  );
};
