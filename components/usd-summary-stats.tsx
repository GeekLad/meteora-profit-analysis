import QuoteTokenProfit from "@/services/QuoteTokenProfits";

export const UsdSummaryStats = (props: {
  quoteTokenProfit: QuoteTokenProfit;
}) => {
  return (
    <div>
      <div className="columns-2">
        <div>Total Deposits:</div>
        <div>
          {(-Number(props.quoteTokenProfit.usdTotalDeposits)).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "usd",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Total Fees:</div>
        <div>
          {Number(props.quoteTokenProfit.usdTotalFees).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "usd",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Div. Loss:</div>
        <div>
          {Number(props.quoteTokenProfit.usdDivergenceLoss).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "usd",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Net Profit:</div>
        <div>
          {Number(props.quoteTokenProfit.usdTotalProfit).toLocaleString(
            Intl.NumberFormat().resolvedOptions().locale,
            {
              style: "currency",
              currency: "usd",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )}
        </div>
      </div>
      <div className="columns-2">
        <div>Profit %:</div>
        <div>
          {props.quoteTokenProfit.usdProfitPercent?.toLocaleString(
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
      {props.quoteTokenProfit.positionCountWithApiErrors > 0 ? (
        <>
          <div className="columns-2">
            <div># of Pos. w/ API Errors:</div>
            <div>
              {props.quoteTokenProfit.positionCountWithApiErrors.toLocaleString(
                Intl.NumberFormat().resolvedOptions().locale,
              )}
            </div>
          </div>
          <div className="columns-2">
            <div>Fees Missing API Data:</div>
            <div>
              {props.quoteTokenProfit.feesMissingApiData.toLocaleString(
                Intl.NumberFormat().resolvedOptions().locale,
              )}{" "}
              {props.quoteTokenProfit.quoteToken.symbol}
            </div>
          </div>
          <div className="columns-2">
            <div>Profit Missing API Data:</div>
            <div>
              {props.quoteTokenProfit.profitMissingApiData.toLocaleString(
                Intl.NumberFormat().resolvedOptions().locale,
              )}{" "}
              {props.quoteTokenProfit.quoteToken.symbol}
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
};
