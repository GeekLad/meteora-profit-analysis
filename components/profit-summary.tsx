import { Card, CardBody, Image } from "@nextui-org/react";

import { QuoteProfitBarChart } from "./quote-profit-bar-chart";
import { QuoteProfitTimeSeries } from "./quote-profit-time-series";
import { QuoteSummaryStats } from "./quote-summary-stats";
import { UsdProfitBarChart } from "./usd-profit-bar-chart";
import { UsdProfitTimeSeries } from "./usd-profit-time-series";
import { UsdSummaryStats } from "./usd-summary-stats";

import { MeteoraPosition } from "@/services/MeteoraPosition";
import { JupiterTokenListToken } from "@/services/JupiterTokenList";
import WalletProfits from "@/services/WalletProfits";

export const ProfitSummary = (props: {
  hidden?: boolean;
  usd: boolean;
  positions: MeteoraPosition[];
  tokenMap: Map<string, JupiterTokenListToken>;
}) => {
  if (props.hidden) {
    return <></>;
  }

  const walletSummary = new WalletProfits(props.positions, props.tokenMap);

  return (
    <div className="w-full md:pl-4 md:pr-4">
      {walletSummary.tokenProfits.map((quoteTokenProfit) => {
        return (
          <Card key={quoteTokenProfit.quoteToken.address} className="mb-4">
            <CardBody className="sm:p-0">
              <div className="md:grid grid-flow-row grid-cols-5 m-4">
                <div>
                  <div className="flex columns-2 mb-4 items-center">
                    <Image
                      src={quoteTokenProfit.quoteToken.logoURI}
                      width="50"
                    />
                    <div className="ml-4 font-bold">
                      {quoteTokenProfit.quoteToken.symbol}
                    </div>
                  </div>
                  {!props.usd ? (
                    <QuoteSummaryStats quoteTokenProfit={quoteTokenProfit} />
                  ) : (
                    <UsdSummaryStats quoteTokenProfit={quoteTokenProfit} />
                  )}
                </div>
                {props.usd ? (
                  <UsdProfitTimeSeries quoteTokenProfit={quoteTokenProfit} />
                ) : (
                  <QuoteProfitTimeSeries quoteTokenProfit={quoteTokenProfit} />
                )}

                {props.usd ? (
                  <UsdProfitBarChart quoteTokenProfit={quoteTokenProfit} />
                ) : (
                  <QuoteProfitBarChart quoteTokenProfit={quoteTokenProfit} />
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};
