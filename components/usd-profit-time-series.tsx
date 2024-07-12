import {
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import QuoteTokenProfit from "@/services/QuoteTokenProfits";

export const UsdProfitTimeSeries = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  const data = props.quoteTokenProfit.cumulativeProfit;

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">Cumulative USD Profit</div>
      <ResponsiveContainer height={200}>
        <LineChart data={data}>
          <XAxis dataKey="Position Close Date" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value={`Cumulative USD Profit`}
            />
          </YAxis>
          <Line
            dataKey="Cumulative Profit in USD"
            dot={false}
            stroke="#8884d8"
            type="monotone"
          />
          <Tooltip
            formatter={(value) =>
              value.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)
            }
            labelStyle={{ color: "black" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
