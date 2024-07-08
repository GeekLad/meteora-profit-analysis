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
      "Divergence Loss": divergence,
      "Total Profit": profit,
    } = props.payload[0].payload;

    return (
      <div className="bg-white text-black">
        <p className="font-bold">{props.label}</p>
        <p>Fees: {fees}</p>
        <p>Divergence Loss: {divergence}</p>
        <p className="font-bold">Net Profit: {profit}</p>
      </div>
    );
  }

  return null;
};

export const ProfitBarChart = (props: {
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
          {/* <Bar dataKey="Divergence Loss" fill="rgb(190 18 60)" stackId="a" />
          <Bar dataKey="Fees" fill="rgb(37 99 235)" stackId="a" /> */}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
