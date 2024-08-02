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
      Fees: fees,
      "Quote Symbol": quote,
      "Total Deposits": totalDeposits,
      "Divergence Loss": divergence,
      "Total Profit": profit,
      "Total Profit Percent": profitPercent,
    } = props.payload[0].payload;

    return (
      <div className="bg-white text-black">
        <p className="font-bold">{props.label}</p>
        <p>
          Total Deposits:{" "}
          {
            -totalDeposits.toLocaleString(
              Intl.NumberFormat().resolvedOptions().locale,
            )
          }{" "}
          {quote}
        </p>
        <p>
          Fees:{" "}
          {fees.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)}{" "}
          {quote}
        </p>
        <p>
          Divergence Loss:{" "}
          {divergence.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}{" "}
          {quote}
        </p>
        <p className="font-bold">
          Net Profit:{" "}
          {profit.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)}{" "}
          {quote}
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

export const QuoteProfitBarChart = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  const data = props.quoteTokenProfit.tokenProfit.sort(
    (a, b) => b["Total Profit"] - a["Total Profit"],
  );

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">
        {props.quoteTokenProfit.quoteToken.symbol} Profit by Token
      </div>
      <ResponsiveContainer height={200}>
        <BarChart data={data}>
          <XAxis dataKey="Symbol" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value={`Total ${props.quoteTokenProfit.quoteToken.symbol} Profit`}
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
          <Bar dataKey="Total Profit" fill="rgb(37 99 235)" stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
