import {
  Bar,
  BarChart,
  Label,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import QuoteTokenProfit from "@/services/QuoteTokenProfits";

export const ProfitBarChart = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  const data = props.quoteTokenProfit.tokenProfit;

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
            formatter={(value) =>
              value.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)
            }
            labelStyle={{ color: "black" }}
          />
          <Bar dataKey="Total Profit" fill="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
