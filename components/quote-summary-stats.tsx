import QuoteTokenProfit from "@/services/QuoteTokenProfits";

export const QuoteSummaryStats = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  return (
    <div>
      <div className="columns-2">
        <div>Total Deposits:</div>
        <div>
          {(-props.quoteTokenProfit.totalDeposits).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Total Fees:</div>
        <div>
          {props.quoteTokenProfit.totalFees.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Div. Loss:</div>
        <div>
          {props.quoteTokenProfit.divergenceLoss.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Net Profit:</div>
        <div>
          {props.quoteTokenProfit.totalProfit.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Profit %:</div>
        <div>
          {props.quoteTokenProfit.profitPercent.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "percent",
              maximumFractionDigits: 2,
            },
          )}
        </div>
      </div>
      <div className="columns-2">
        <div># of Tokens:</div>
        <div>
          {props.quoteTokenProfit.pairGroupCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div># of Positions:</div>
        <div>
          {props.quoteTokenProfit.positionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
      <div className="columns-2">
        <div># of Txns:</div>
        <div>
          {props.quoteTokenProfit.transactionCount.toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
          )}
        </div>
      </div>
    </div>
  );
};
