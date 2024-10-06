import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

export interface Token {
  mint: string;
  symbol: string;
  decimals: number;
  logo: string;
}

interface TransactionData {
  deposits: number;
  fees: number;
  impermanentLoss: number;
  profit: number;
  usdDeposits: number;
  usdFees: number;
  usdImpermanentLoss: number;
  usdProfit: number;
}

interface TransactionSummary extends TransactionData {
  positionCount: number;
  transactionCount: number;
  usdLoadCount: number;
  startDate: Date;
  endDate: Date;
}

interface TransactionTimeSeriesDataPoint extends TransactionData {
  blockTime: number;
  date: string;
  dateTime: string;
}

export interface TokenSummary {
  token: Token;
  summary: TransactionSummary;
  transactionTimeSeries: TransactionTimeSeriesDataPoint[];
}

export interface QuoteTokenSummary extends TokenSummary {
  base: TokenSummary[];
}

export interface SummaryData {
  positionTransactionCount: number;
  positionCount: number;
  usdLoadCount: number;
  usdFees: number;
  usdImpermanentLoss: number;
  usdProfit: number;
  startDate: Date;
  endDate: Date;
  quote: Map<string, QuoteTokenSummary>;
}

export type PositionStatus = "all" | "open" | "closed";
export type HawksightStatus = "include" | "exclude" | "hawksightOnly";
export interface TransactionFilter {
  startDate: Date;
  endDate: Date;
  positionStatus: PositionStatus;
  hawksight: HawksightStatus;
  baseTokenMints: Set<string>;
  quoteTokenMints: Set<string>;
}

export function generateSummary(
  transactions: MeteoraDlmmDbTransactions[],
): SummaryData {
  const summary: SummaryData = {
    positionTransactionCount: 0,
    positionCount: 0,
    usdLoadCount: 0,
    usdFees: 0,
    usdImpermanentLoss: 0,
    usdProfit: 0,
    quote: new Map(),
    startDate: new Date(),
    endDate: new Date(),
  };

  const positions: Set<string> = new Set();
  const signatures: Set<string> = new Set();

  transactions.forEach((tx) => {
    positions.add(tx.position_address);
    signatures.add(tx.signature);
    if (!summary.quote.has(tx.quote_mint)) {
      const newQuoteToken: Token = {
        mint: tx.quote_mint,
        symbol: tx.quote_symbol,
        decimals: tx.quote_decimals,
        logo: tx.quote_logo,
      };

      summary.quote.set(
        newQuoteToken.mint,
        summarizeToken(transactions, newQuoteToken) as QuoteTokenSummary,
      );
    }
  });
  summary.positionCount = positions.size;
  summary.positionTransactionCount = signatures.size;
  summary.usdLoadCount =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
          .map((quoteSummary) => quoteSummary.summary.usdLoadCount)
          .reduce((total, current) => total + current)
      : 0;
  summary.usdFees =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
          .map((quoteSummary) => quoteSummary.summary.usdFees)
          .reduce((total, current) => total + current)
      : 0;
  summary.usdImpermanentLoss =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
          .map((quoteSummary) => quoteSummary.summary.usdImpermanentLoss)
          .reduce((total, current) => total + current)
      : 0;
  summary.usdProfit =
    summary.quote.size > 0
      ? Array.from(summary.quote.values())
          .map((quoteSummary) => quoteSummary.summary.usdProfit)
          .reduce((total, current) => total + current)
      : 0;

  summary.quote = new Map(
    Array.from(summary.quote.values())
      .sort((a, b) => b.summary.transactionCount - a.summary.transactionCount)
      .map((s) => [s.token.mint, s]),
  );

  summary.startDate = new Date(
    Math.min(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat(),
    ),
  );

  summary.startDate = new Date(
    Math.min(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat(),
    ),
  );

  summary.endDate = new Date(
    Math.max(
      ...Array.from(summary.quote.values())
        .map((s) => s.transactionTimeSeries.map((t) => t.blockTime * 1000))
        .flat(),
    ),
  );

  return summary;
}

function summarizeToken(
  transactions: MeteoraDlmmDbTransactions[],
  quoteToken: Token,
  baseToken?: Token,
): TokenSummary | QuoteTokenSummary {
  const { mint: quoteMint } = quoteToken;
  const baseMint = baseToken?.mint;
  const transactionTimeSeries: TransactionTimeSeriesDataPoint[] = [];
  const baseTokens: Map<string, Token> = new Map();

  let summary = {
    positionCount: 0,
    transactionCount: 0,
    usdLoadCount: 0,
    deposits: 0,
    fees: 0,
    impermanentLoss: 0,
    profit: 0,
    usdDeposits: 0,
    usdFees: 0,
    usdImpermanentLoss: 0,
    usdProfit: 0,
    startDate: new Date(),
    endDate: new Date(),
  };

  const tokenTransactions = transactions.filter(
    (tx) =>
      tx.quote_mint == quoteMint &&
      (!baseMint || (baseMint && tx.base_mint == baseMint)),
  );

  summary.startDate = new Date(tokenTransactions[0].block_time * 1000);
  summary.endDate = new Date(
    tokenTransactions[tokenTransactions.length - 1].block_time * 1000,
  );

  if (tokenTransactions.length == 0) {
    return {
      token: quoteToken,
      summary,
      transactionTimeSeries,
    };
  }

  // Create a set of position addresses to track the # of positions
  const positions: Set<string> = new Set();
  const usdPositions: Set<string> = new Set();

  tokenTransactions.forEach((tx) => {
    // Add the base token if we're creating a quote token summary
    if (!baseTokens.has(tx.base_mint)) {
      baseTokens.set(tx.base_mint, {
        mint: tx.base_mint,
        symbol: tx.base_symbol,
        decimals: tx.base_decimals,
        logo: tx.base_logo,
      });
    }

    // Add the position address for the position count
    positions.add(tx.position_address);
    const positionCount = positions.size;

    // Add for usdPositionCount
    if (tx.usd_deposit + tx.usd_withdrawal > 0) {
      usdPositions.add(tx.position_address);
    }
    const usdLoadCount = usdPositions.size;
    // Destructure the current summary to increment all the values
    // using the current transaction
    let {
      transactionCount,
      deposits,
      fees,
      impermanentLoss,
      profit,
      usdDeposits,
      usdFees,
      usdImpermanentLoss,
      usdProfit,
    } = summary;

    // Get the timestamp data
    const { block_time: blockTime } = tx;
    const date = new Date(blockTime * 1000).toLocaleDateString();
    const dateTime =
      date + " " + new Date(blockTime * 1000).toLocaleTimeString();

    // Update all the cumulative values
    transactionCount++;

    deposits = floor(deposits + tx.deposit, tx.quote_decimals);
    fees = floor(fees + tx.fee_amount, tx.quote_decimals);
    impermanentLoss = floor(
      impermanentLoss + tx.impermanent_loss,
      tx.quote_decimals,
    );
    profit = floor(profit + tx.pnl, tx.quote_decimals);
    usdDeposits = floor(usdDeposits + tx.usd_deposit, 2);
    usdFees = floor(usdFees + tx.usd_fee_amount, 2);
    usdImpermanentLoss = floor(usdImpermanentLoss + tx.usd_impermanent_loss, 2);
    usdProfit = floor(usdProfit + tx.usd_pnl, 2);

    // Update the main summary with the new cumulative values
    summary = {
      ...summary,
      positionCount,
      transactionCount,
      usdLoadCount,
      deposits,
      fees,
      impermanentLoss,
      profit,
      usdDeposits,
      usdFees,
      usdImpermanentLoss,
      usdProfit,
    };

    // Add the time series data
    transactionTimeSeries.push({
      blockTime,
      date,
      dateTime,
      deposits,
      fees,
      impermanentLoss,
      profit,
      usdDeposits,
      usdFees,
      usdImpermanentLoss,
      usdProfit,
    });
  });

  if (baseToken) {
    return {
      token: baseToken,
      summary,
      transactionTimeSeries,
    };
  }

  const base = Array.from(baseTokens.values()).map((baseToken) =>
    summarizeToken(transactions, quoteToken, baseToken),
  );

  return {
    token: quoteToken,
    summary,
    transactionTimeSeries,
    base,
  };
}

function floor(value: number, decimals: number) {
  return Math.round(value * 10 ** decimals) / 10 ** decimals;
}
