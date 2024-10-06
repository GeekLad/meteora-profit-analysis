import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const QuoteTokenStatsNonUsd = (props: {
  summary: QuoteTokenSummary;
}) => {
  return (
    <div>
      <div className="columns-2 flex items-end">
        <div className="flex-1">Total Deposits:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.deposits.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1">Total Fees:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.fees.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1">Impermanent Loss:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.impermanentLoss.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1">Net Profit:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.profit.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1">Profit %:</div>
        <div className="flex-1 text-right">
          {(
            props.summary.summary.profit / props.summary.summary.deposits
          ).toLocaleString(Intl.NumberFormat().resolvedOptions().locale, {
            style: "percent",
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1"># of Positions:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.positionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2 flex items-end">
        <div className="flex-1"># of Txns:</div>
        <div className="flex-1 text-right">
          {props.summary.summary.transactionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
    </div>
  );
};
