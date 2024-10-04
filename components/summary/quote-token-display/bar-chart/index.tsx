import { QuoteTokenSummary } from "@/components/summary/generate-summary";
import { QuoteTokenBarChartUsd } from "@/components/summary/quote-token-display/bar-chart/usd-bar-chart";
import { QuoteTokenBarChartNonUsd } from "@/components/summary/quote-token-display/bar-chart/non-usd-bar-chart";

export const QuoteTokenBarChart = (props: {
  summary: QuoteTokenSummary;
  displayUsd: boolean;
}) => {
  if (props.displayUsd) {
    return <QuoteTokenBarChartUsd summary={props.summary} />;
  }

  return <QuoteTokenBarChartNonUsd summary={props.summary} />;
};
