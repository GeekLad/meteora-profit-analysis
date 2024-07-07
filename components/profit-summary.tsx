import { Card, CardBody, Image } from "@nextui-org/react";

import { ProfitBarChart } from "./profit-bar-chart";
import { ProfitTimeSeries } from "./profit-time-series";

import { MeteoraPosition } from "@/services/MeteoraPosition";
import { JupiterTokenListToken } from "@/services/JupiterTokenList";
import WalletProfits from "@/services/WalletProfits";

export const ProfitSummary = (props: {
  hidden?: boolean;
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
                  <div className="">
                    <div className="columns-2">
                      <div>Total Profit:</div>
                      <div>
                        {quoteTokenProfit.totalProfit.toLocaleString(
                          Intl.NumberFormat().resolvedOptions().locale,
                        )}
                      </div>
                    </div>
                    <div className="columns-2">
                      <div># of Tokens:</div>
                      <div>{quoteTokenProfit.pairGroupCount}</div>
                    </div>
                    <div className="columns-2">
                      <div># of Positions:</div>
                      <div>{quoteTokenProfit.positionCount}</div>
                    </div>
                  </div>
                </div>
                <ProfitTimeSeries quoteTokenProfit={quoteTokenProfit} />
                <ProfitBarChart quoteTokenProfit={quoteTokenProfit} />
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
};
