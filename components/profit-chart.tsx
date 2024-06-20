import {
  Label,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const ProfitChart = (props: {
  positionLoadingState: PositionLoadingState;
}) => {
  if (props.positionLoadingState.profits.length == 0) {
    return <></>;
  }

  const data = props.positionLoadingState.profits
    .sort(
      (a, b) => a.most_recent_deposit_withdraw - b.most_recent_deposit_withdraw,
    )
    .map((profit) => {
      return {
        date: new Date(
          profit.most_recent_deposit_withdraw,
        ).toLocaleDateString(),
        cumulativeProfit: profit.total_profit,
      };
    });

  data.forEach((profit, index) => {
    if (index > 0) {
      profit.cumulativeProfit += data[index - 1].cumulativeProfit;
    }
  });

  return (
    <div className="h-full m-4">
      <h2 className="text-xl font-bold text-center">
        Cumulative Profit Over Time
      </h2>
      <ResponsiveContainer minHeight={400} width="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" />
          <YAxis>
            <Label
              angle={-90}
              position="insideLeft"
              style={{ textAnchor: "middle" }}
              value="Cumulative Profit"
            />
          </YAxis>
          <Line
            dataKey="cumulativeProfit"
            dot={false}
            stroke="#8884d8"
            type="monotone"
          />
          <Tooltip
            formatter={(value) =>
              value.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            }
            labelStyle={{ color: "black" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
