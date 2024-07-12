import { useState } from "react";

import { LoadingSummary } from "./loading-summary";
import { ProfitSummary } from "./profit-summary";
import { QuoteTokenSummaryFilter } from "./quote-token-summary-filter";

import { MeteoraPosition } from "@/services/MeteoraPosition";
import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const ProfitDisplay = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  const [initialized, setInitialized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [filteredPositions, setFilteredPositions] = useState(
    props.positionLoadingState.positions,
  );
  const [usd, setUsd] = useState(false);

  if (props.positionLoadingState.startTime == 0) {
    return <></>;
  }

  if (!props.loading && !initialized) {
    setInitialized(true);
    setFilteredPositions(props.positionLoadingState.positions);
  }

  function filterPositions(filteredPositions: MeteoraPosition[]) {
    setFilteredPositions(filteredPositions);
  }

  return (
    <div>
      <div className="w-full">
        <LoadingSummary
          loading={props.loading}
          positionLoadingState={props.positionLoadingState}
          usd={usd}
        />
        <QuoteTokenSummaryFilter
          expanded={expanded}
          hidden={props.loading}
          positionLoadingState={props.positionLoadingState}
          usd={usd}
          onExpandToggle={(expanded) => setExpanded(expanded)}
          onFilter={(positions) => filterPositions(positions)}
          onUsdToggle={() => setUsd(!usd)}
        />
        <ProfitSummary
          hidden={props.loading}
          positions={filteredPositions}
          tokenMap={props.positionLoadingState.tokenMap}
          usd={usd}
        />
      </div>
    </div>
  );
};
