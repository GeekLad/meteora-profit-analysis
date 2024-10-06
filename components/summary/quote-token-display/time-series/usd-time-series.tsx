import {
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const UsdTimeSeries = (props: { summary: QuoteTokenSummary }) => {
  const data = props.summary.transactionTimeSeries;
  const minTimestamp = Math.min(...data.map((d) => d["blockTime"]));
  const maxTimestamp = Math.max(...data.map((d) => d["blockTime"]));

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">Cumulative USD Profit</div>
      <ResponsiveContainer height={200}>
        <LineChart data={data}>
          <XAxis
            dataKey="blockTime"
            domain={[minTimestamp, maxTimestamp]}
            tickFormatter={(timestamp) =>
              new Date(timestamp * 1000).toLocaleDateString()
            }
            type="number"
          />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value={"Cumulative USD Profit"}
            />
          </YAxis>
          <Line
            dataKey="usdProfit"
            dot={false}
            name="Cumulative USD Profit"
            stroke="#8884d8"
            type="monotone"
          />
          <Tooltip
            formatter={(value) =>
              value.toLocaleString(
                Intl.NumberFormat().resolvedOptions().locale,
                { style: "currency", currency: "USD" },
              )
            }
            labelFormatter={(timestamp) =>
              new Date(timestamp * 1000).toLocaleDateString() +
              " " +
              new Date(timestamp * 1000).toLocaleTimeString()
            }
            labelStyle={{ color: "black" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
