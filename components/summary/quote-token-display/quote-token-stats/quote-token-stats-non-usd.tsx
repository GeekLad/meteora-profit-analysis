import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const QuoteTokenStatsNonUsd = (props: { summary: QuoteTokenSummary }) => {
  return (
    <div>
      <div className="columns-2">
        <div>Total Deposits:</div>
        <div>
          {props.summary.summary.deposits.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Total Fees:</div>
        <div>
          {props.summary.summary.fees.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Impermanent Loss:</div>
        <div>
          {props.summary.summary.impermanentLoss.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Net Profit:</div>
        <div>
          {props.summary.summary.profit.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Profit %:</div>
        <div>
          {(
            props.summary.summary.profit / props.summary.summary.deposits
          ).toLocaleString(Intl.NumberFormat().resolvedOptions().locale, {
            style: "percent",
            maximumFractionDigits: 2,
          })}
        </div>
      </div>
      <div className="columns-2">
        <div># of Positions:</div>
        <div>
          {props.summary.summary.positionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div># of Txns:</div>
        <div>
          {props.summary.summary.transactionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
    </div>
  );
};
