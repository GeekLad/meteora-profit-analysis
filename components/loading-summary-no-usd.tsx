import { Button, Card, CardBody } from "@nextui-org/react";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const LoadingSummaryNoUsd = (props: {
  positionLoadingState: PositionLoadingState;
}) => {
  const oldestTransaction =
    props.positionLoadingState.transactions.length > 0
      ? props.positionLoadingState.transactions.sort(
          (a, b) => a.timestamp_ms - b.timestamp_ms,
        )[0]
      : null;

  const oldestTransactionDate = oldestTransaction
    ? new Date(oldestTransaction.timestamp_ms).toLocaleDateString() +
      " " +
      new Date(oldestTransaction.timestamp_ms).toLocaleTimeString()
    : "";

  return (
    <Card
      className={`md:m-4 sm:mb-4 self-start ${props.positionLoadingState.updatingUsdValues || !oldestTransactionDate ? "hidden" : ""}`}
    >
      <CardBody>
        <p className="mb-4">
          <b>Oldest position transaction:</b> {oldestTransactionDate}
        </p>
        <p className="mb-4">
          If you know you have no DLMM transactions prior to the date above or
          you do not want to analyze on older transactions/positions, you can
          safely stop loading more transactions.
        </p>
        <Button
          className="w-half mb-4"
          color="danger"
          onClick={() => {
            if (props.positionLoadingState.cancel) {
              props.positionLoadingState.cancel();
            }
          }}
        >
          Stop Loading Wallet Transactions
        </Button>
      </CardBody>
    </Card>
  );
};
