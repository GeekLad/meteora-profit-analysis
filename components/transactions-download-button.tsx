import { Button, Tooltip } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import { downloadObjArrayAsCsv } from "@/services/util";
import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const TransactionsDownloadButton = (props: {
  hidden?: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  if (props.hidden || props.positionLoadingState.transactions.length == 0) {
    return <></>;
  }

  const onClick = () => {
    downloadObjArrayAsCsv(
      "transactions.csv",
      props.positionLoadingState.transactions,
      [
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
        "balanceChangeValue",
        "openBalanceValue",
        "claimedFeesValue",
        "unclaimedFeesValue",
        "totalFeesValue",
        "usdBalanceChangeValue",
        "usdClaimedFeesValue",
        "usdOpenBalanceValue",
        "usdUnclaimedFeesValue",
      ],
    );
  };

  return (
    <Tooltip
      color="warning"
      content="Note: USD values are not fully loaded in yet, some transactions will be missing USD values."
      isDisabled={props.positionLoadingState.apiDataLoaded}
    >
      <Button
        aria-label="Download Transactions"
        className="m-4"
        color="primary"
        startContent={<DownloadIcon />}
        onClick={() => onClick()}
      >
        Download Transactions
      </Button>
    </Tooltip>
  );
};
