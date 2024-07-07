import { Card, CardBody } from "@nextui-org/react";
import { useState } from "react";

import { LoadingItem } from "./loading-status-item";
import { TransactionsDownloadButton } from "./transactions-download-button";
import { PositionsDownloadButton } from "./positions-download-button";
import { QuoteTokenSummaryFilter } from "./quote-token-summary-filter";

import { type PositionLoadingState } from "@/pages/wallet/[walletAddress]";
import { MeteoraPosition } from "@/services/MeteoraPosition";

export const LoadingSummary = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
  onFilter: (filteredPositions: MeteoraPosition[]) => any;
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="md:flex w-auto items-end">
      <Card className="md:m-4 md:w-1/2 sm:w-full">
        <CardBody>
          <LoadingItem
            title="Time Elapsed"
            value={props.positionLoadingState.durationString}
          />
          <LoadingItem
            loading={!props.positionLoadingState.allSignaturesFound}
            title="# of Transactions Found"
            value={props.positionLoadingState.signatureCount}
          />
          <LoadingItem
            loading={
              !props.positionLoadingState.allPositionsFound &&
              !props.positionLoadingState.done
            }
            title="# of Position Transactions"
            value={props.positionLoadingState.transactionCount}
          />
          <LoadingItem
            hidden={!props.positionLoadingState.allPositionsFound}
            loading={props.positionLoadingState.updatingOpenPositions}
            title={
              props.positionLoadingState.updatingOpenPositions
                ? "Updating Open Positions"
                : "Open Positions Updated"
            }
          />
        </CardBody>
      </Card>
      <div className="w-2/3">
        <div className="md:flex">
          <TransactionsDownloadButton
            hidden={props.loading || expanded}
            transactions={props.positionLoadingState.transactions}
          />
          <PositionsDownloadButton
            hidden={props.loading || expanded}
            positions={props.positionLoadingState.positions}
          />
          <QuoteTokenSummaryFilter
            hidden={props.loading}
            positions={props.positionLoadingState.positions}
            tokenMap={props.positionLoadingState.tokenMap}
            onExpandToggle={(expanded) => setExpanded(expanded)}
            onFilter={(positions) => props.onFilter(positions)}
          />
        </div>
      </div>
    </div>
  );
};
