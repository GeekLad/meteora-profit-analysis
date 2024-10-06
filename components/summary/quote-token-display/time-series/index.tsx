import { QuoteTokenSummary } from "@/components/summary/generate-summary";
import { UsdTimeSeries } from "@/components/summary/quote-token-display/time-series/usd-time-series";
import { NonUsdTimeSeries } from "@/components/summary/quote-token-display/time-series/non-usd-time-series";

export const QuoteTokenTimeSeries = (props: {
  summary: QuoteTokenSummary;
  displayUsd: boolean;
}) => {
  if (props.displayUsd) {
    return <UsdTimeSeries summary={props.summary} />;
  }

  return <NonUsdTimeSeries summary={props.summary} />;
};
