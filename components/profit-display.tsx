import { UserPositionList } from "./user-position-list";
import { LoadingSummary } from "./loading-summary";

import { PositionLoadingState } from "@/pages";

export const ProfitDisplay = (props: {
  loading: boolean;
  positionLoadingState: PositionLoadingState;
}) => {
  if (props.positionLoadingState.startTime == 0) {
    return <></>;
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
