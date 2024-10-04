import { QuoteTokenSummary } from "@/components/summary/generate-summary";

export const QuoteTokenStatsUsd = (props: { summary: QuoteTokenSummary }) => {
  return (
    <div>
      <div className="columns-2">
        <div>Total Deposits:</div>
        <div>
          {props.summary.summary.usdDeposits.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Total Fees:</div>
        <div>
          {props.summary.summary.usdFees.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Impermanent Loss:</div>
        <div>
          {props.summary.summary.usdImpermanentLoss.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Net Profit:</div>
        <div>
          {props.summary.summary.usdProfit.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Profit %:</div>
        <div>
          {(
            props.summary.summary.usdProfit / props.summary.summary.usdDeposits
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
