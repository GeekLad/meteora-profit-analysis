import {
  Bar,
  BarChart,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ContentType } from "recharts/types/component/Tooltip";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import QuoteTokenProfit from "@/services/QuoteTokenProfits";

const ProfitTooltip: ContentType<ValueType, NameType> = (props) => {
  if (props.active && props.payload && props.payload.length) {
    const {
      "Fees in USD": fees,
      "Total Deposits in USD": totalDeposits,
      "Divergence Loss in USD": divergence,
      "Total Profit in USD": profit,
      "USD Total Profit Percent": profitPercent,
    } = props.payload[0].payload;

    return (
      <div className="bg-white text-black p-2">
        <p className="font-bold">{props.label}</p>
        <p>
          Total Deposits:{" "}
          {(-totalDeposits).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}{" "}
          USD
        </p>
        <p>
          Fees:{" "}
          {fees.toLocaleString(Intl.NumberFormat().resolvedOptions().locale, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          USD
        </p>
        <p>
          Divergence Loss:{" "}
          {divergence.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}{" "}
          USD
        </p>
        <p className="font-bold">
          Net Profit:{" "}
          {profit.toLocaleString(Intl.NumberFormat().resolvedOptions().locale, {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
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

export const UsdProfitBarChart = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  const data = props.quoteTokenProfit.tokenProfit.sort(
    (a, b) =>
      Number(b["Total Profit in USD"]) - Number(a["Total Profit in USD"]),
  );

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">USD Profit by Token</div>
      <ResponsiveContainer height={200}>
        <BarChart data={data}>
          <XAxis dataKey="Symbol" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value="Total USD Profit"
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
            dataKey="Total Profit in USD"
            fill="rgb(37 99 235)"
            stackId="a"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
