import { Button, Tooltip } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import { downloadObjArrayAsCsv } from "@/services/util";
import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const PositionsDownloadButton = (props: {
  hidden?: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  if (props.hidden || props.positionLoadingState.positions.length == 0) {
    return <></>;
  }

  const onClick = () => {
    downloadObjArrayAsCsv(
      "positions.csv",
      props.positionLoadingState.positions,
      [
        "openTimestamp",
        "closeTimestamp",
        "isClosed",
        "pairName",
        "symbolX",
        "symbolY",
        "mintX",
        "mintY",
        "position",
        "lbPair",
        "isHawksight",
        "isOneSided",
        "hasNoFees",
        "hasNoImpermanentLoss",
        "inverted",
        "hasApiError",
        "depositsValue",
        "withdrawsValue",
        "openBalanceValue",
        "netDepositsAndWithdrawsValue",
        "claimedFeesValue",
        "unclaimedFeesValue",
        "totalFeesValue",
        "profitLossValue",
        "usdDepositsValue",
        "usdWithdrawsValue",
        "usdClaimedFeesValue",
        "usdOpenBalanceValue",
        "usdUnclaimedFeesValue",
        "usdProfitLossValue",
      ],
    );
  };

  return (
    <Tooltip
      color="warning"
      content="Note: USD values are not fully loaded in yet, some positions will be missing USD values."
      isDisabled={props.positionLoadingState.apiDataLoaded}
    >
      <Button
        aria-label="Download Positions"
        className="m-4"
        color="primary"
        startContent={<DownloadIcon />}
        onClick={() => onClick()}
      >
        Download Positions
      </Button>
    </Tooltip>
  );
};
