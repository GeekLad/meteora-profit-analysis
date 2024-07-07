import { useState } from "react";

import { LoadingSummary } from "./loading-summary";
import { ProfitSummary } from "./profit-summary";

import { MeteoraPosition } from "@/services/MeteoraPosition";
import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const ProfitDisplay = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  const [initialized, setInitialized] = useState(false);
  const [filteredPositions, setFilteredPositions] = useState(
    props.positionLoadingState.positions,
  );

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
          onFilter={(positions) => filterPositions(positions)}
        />
        <ProfitSummary
          hidden={props.loading}
          positions={filteredPositions}
          tokenMap={props.positionLoadingState.tokenMap}
        />
      </div>
    </div>
  );
};
