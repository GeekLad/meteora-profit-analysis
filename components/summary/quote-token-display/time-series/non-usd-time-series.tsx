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

export const NonUsdTimeSeries = (props: { summary: QuoteTokenSummary }) => {
  const data = props.summary.transactionTimeSeries;
  const minTimestamp = Math.min(...data.map((d) => d["blockTime"]));
  const maxTimestamp = Math.max(...data.map((d) => d["blockTime"]));

  return (
    <div className="col-span-2 md:m-4 sm:mt-4">
      <div className="text-center">
        Cumulative {props.summary.token.symbol} Profit
      </div>
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
              value={`Cumulative ${props.summary.token.symbol} Profit`}
            />
          </YAxis>
          <Line
            dataKey="profit"
            dot={false}
            name={`Cumulative ${props.summary.token.symbol} Profit`}
            stroke="#8884d8"
            type="monotone"
          />
          <Tooltip
            formatter={(value) =>
              value.toLocaleString(Intl.NumberFormat().resolvedOptions().locale)
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
