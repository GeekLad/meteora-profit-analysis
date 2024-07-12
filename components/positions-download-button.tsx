import { Button } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import { downloadObjArrayAsCsv } from "@/services/util";
import { MeteoraPosition } from "@/services/MeteoraPosition";

export const PositionsDownloadButton = (props: {
  hidden?: boolean;
  positions: MeteoraPosition[];
}) => {
  if (props.hidden || props.positions.length == 0) {
    return <></>;
  }

  const onClick = () => {
    downloadObjArrayAsCsv("positions.csv", props.positions, [
      "pairName",
      "symbolX",
      "symbolY",
      "mintX",
      "mintY",
      "position",
      "lbPair",
      "openTimestampMs",
      "closeTimestampMs",
      "isClosed",
      "isHawksight",
      "isOneSided",
      "hasNoFees",
      "hasNoIl",
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
      "usdNetDepositsAndWithdrawsValue",
      "usdClaimedFeesValue",
    ]);
  };

  return (
    <Button
      aria-label="Download Positions"
      className="m-4"
      color="primary"
      startContent={<DownloadIcon />}
      onClick={() => onClick()}
    >
      Download Positions
    </Button>
  );
};
