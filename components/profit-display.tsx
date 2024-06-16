import { UserPositionList } from "./user-position-list";
import { LoadingSummary } from "./loading-summary";
import { NoResultsFound } from "./no-results-found";

import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const ProfitDisplay = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  if (props.positionLoadingState.startTime == 0) {
    return <></>;
  }

  if (
    props.positionLoadingState.done &&
    props.positionLoadingState.userProfit.pair_groups.length == 0
  ) {
    return <NoResultsFound />;
  }

  return (
    <div>
      <div className="w-full">
        <LoadingSummary
          loading={props.loading}
          positionLoadingState={props.positionLoadingState}
        />
      </div>
      <div className="w-full">
        <UserPositionList positionLoadingState={props.positionLoadingState} />
      </div>
    </div>
  );
};
