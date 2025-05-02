import { Card, CardBody } from "@heroui/card";
import Image from "next/image";

import { QuoteTokenStats } from "@/components/summary/quote-token-display/quote-token-stats";
import { QuoteTokenSummary } from "@/components/summary/generate-summary";
import { QuoteTokenTimeSeries } from "@/components/summary/quote-token-display/time-series";
import { QuoteTokenBarChart } from "@/components/summary/quote-token-display/bar-chart";

export const QuoteTokenDisplay = (props: {
  summary: QuoteTokenSummary;
  displayUsd: boolean;
}) => {
  if (props.summary.summary.deposits == 0) {
    return <></>;
  }

  return (
    <Card key={props.summary.token.mint} className="mb-4">
      <CardBody className="sm:p-0">
        <div className="md:grid grid-flow-row grid-cols-5 m-4">
          <div>
            <div className="flex columns-2  items-center">
              <Image
                height="50"
                alt="token_logo"
                src={props.summary.token.logo}
                width="50"
              />
              <div className="ml-4 font-bold">{props.summary.token.symbol}</div>
            </div>
            <QuoteTokenStats
              displayUsd={props.displayUsd}
              summary={props.summary}
            />
          </div>
          <QuoteTokenTimeSeries
            displayUsd={props.displayUsd}
            summary={props.summary}
          />
          <QuoteTokenBarChart
            displayUsd={props.displayUsd}
            summary={props.summary}
          />
        </div>
      </CardBody>
    </Card>
  );
};
