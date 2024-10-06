import { ContentType } from "recharts/types/component/Tooltip";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Label,
  Bar,
  Tooltip,
} from "recharts";

import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const QuoteTokenBarChartNonUsd = (props: {
  summary: QuoteTokenSummary;
}) => {
  const ProfitTooltip: ContentType<ValueType, NameType> = (tooltipProps) => {
    if (
      tooltipProps.active &&
      tooltipProps.payload &&
      tooltipProps.payload.length
    ) {
      const { fees, deposits, impermanentLoss, profit } =
        tooltipProps.payload[0].payload;
      const profitPercent = profit / deposits;

      return (
        <div className="bg-white text-black p-2">
          <p className="font-bold">{tooltipProps.label}</p>
          <p>
            Total Deposits:{" "}
            {deposits.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
            )}
            {` ${props.summary.token.symbol}`}
          </p>
          <p>
            Fees:{" "}
            {fees.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)}
            {` ${props.summary.token.symbol}`}
          </p>
          <p>
            Impermanent Loss:{" "}
            {impermanentLoss.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
            )}
            {` ${props.summary.token.symbol}`}
          </p>
          <p className="font-bold">
            Net Profit:{" "}
            {profit.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
            )}
            {` ${props.summary.token.symbol}`}
          </p>
          <p className="font-bold">
            Profit %:{" "}
            {profitPercent.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
              { style: "percent", maximumFractionDigits: 2 },
            )}
          </p>
        </div>
      );
    }

    return null;
  };

  const data = props.summary.base
    .map((base) => {
      return {
        symbol: base.token.symbol,
        deposits: base.summary.deposits,
        fees: base.summary.fees,
        impermanentLoss: base.summary.impermanentLoss,
        profit: base.summary.profit,
      };
    })
    .sort((a, b) => b.profit - a.profit);

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">
        {props.summary.token.symbol} Profit by Token
      </div>
      <ResponsiveContainer height={200}>
        <BarChart data={data}>
          <XAxis dataKey="symbol" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value={`Total ${props.summary.token.symbol} Profit`}
            />
          </YAxis>
          <Tooltip
            content={
              // Adding this to avoid lint complaint on build
              // @ts-ignore
              <ProfitTooltip />
            }
            formatter={(value) =>
              value.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)
            }
            labelStyle={{ color: "black" }}
          />
          <Bar
            dataKey="profit"
            fill="rgb(37 99 235)"
            name=" Profit"
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
