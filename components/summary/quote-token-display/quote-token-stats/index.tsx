import { QuoteTokenStatsNonUsd } from "@/components/summary/quote-token-display/quote-token-stats/quote-token-stats-non-usd";
import { QuoteTokenSummary } from "@/components/summary/generate-summary";
import { QuoteTokenStatsUsd } from "@/components/summary/quote-token-display/quote-token-stats/quote-token-stats-usd";

export const QuoteTokenStats = (props: {
  summary: QuoteTokenSummary;
  displayUsd: boolean;
}) => {
  if (props.displayUsd) {
    return <QuoteTokenStatsUsd summary={props.summary} />;
  }

  return <QuoteTokenStatsNonUsd summary={props.summary} />;
};
