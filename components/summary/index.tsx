import MeteoraDlmmDb, {
  MeteoraDlmmDbTransactions,
} from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import { useEffect, useState, useMemo, useCallback } from "react";
import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";
import { useRouter } from "next/router";

import { SummaryTop } from "@/components/summary/top";
import { QuoteTokenDisplay } from "@/components/summary/quote-token-display";
import { Filter } from "@/components/summary/filter";
import {
  generateSummary,
  TransactionFilter,
} from "@/components/summary/generate-summary";
import { delay } from "@/services/util";

export const Summary = (props: {
  db: MeteoraDlmmDb;
  downloader: MeteoraDownloader;
}) => {
  const initialTransactions = useMemo(
    () => props.db.getTransactions(),
    [props.db],
  );
  const router = useRouter();

  const [allTransactions, setAllTransactions] = useState(initialTransactions);
  const [summary, setSummary] = useState(generateSummary(initialTransactions));
  const [filteredSummary, setFilteredSummary] = useState(
    generateSummary(initialTransactions),
  );
  const [cancelled, setCancelled] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [filter, setTransactionFilter] = useState(getDefaultFilter());
  const [displayUsd, setDisplayUsd] = useState(false);

  function getDefaultFilter(
    transactions?: MeteoraDlmmDbTransactions[],
  ): TransactionFilter {
    transactions = transactions ? transactions : allTransactions;

    return {
      startDate:
        transactions.length > 0
          ? new Date(
              Math.min(...transactions.map((tx) => tx.block_time * 1000)),
            )
          : new Date("11/03/2023"),
      endDate:
        transactions.length > 0
          ? new Date(
              Math.max(...transactions.map((tx) => tx.block_time * 1000)),
            )
          : new Date(),
      positionStatus: "all",
      hawksight: "include",
      baseTokenMints: new Set(transactions.map((tx) => tx.base_mint)),
      quoteTokenMints: new Set(transactions.map((tx) => tx.quote_mint)),
    } as TransactionFilter;
  }

  const filterTransactions = useCallback(
    (transactions: MeteoraDlmmDbTransactions[], filter?: TransactionFilter) => {
      const transactionFilter = filter || getDefaultFilter(transactions);
      const filteredTransactions = transactions.filter((tx) => {
        if (tx.block_time < transactionFilter.startDate.getTime() / 1000)
          return false;
        if (tx.block_time > transactionFilter.endDate.getTime() / 1000)
          return false;
        if (
          transactionFilter.positionStatus === "closed" &&
          tx.position_is_open
        )
          return false;
        if (transactionFilter.positionStatus === "open" && !tx.position_is_open)
          return false;
        if (transactionFilter.hawksight == "exclude" && tx.is_hawksight)
          return false;
        if (transactionFilter.hawksight == "hawksightOnly" && !tx.is_hawksight)
          return false;
        if (!transactionFilter.baseTokenMints.has(tx.base_mint)) return false;
        if (!transactionFilter.quoteTokenMints.has(tx.quote_mint)) return false;

        return true;
      });

      setFilteredSummary(generateSummary(filteredTransactions));
      setTransactionFilter(transactionFilter);
    },
    [],
  );

  const readData = useCallback(async (walletAddress: string) => {
    while (!isDone()) {
      const start = Date.now();
      const latestTransactions = props.db
        .getTransactions()
        .filter((tx) => tx.owner_address == walletAddress);

      setSummary(generateSummary(latestTransactions));
      setAllTransactions(latestTransactions);
      filterTransactions(latestTransactions);
      const dbReadTime = Date.now() - start;
      const delayMs = Math.min(5000, 3 * dbReadTime);

      console.log(
        `${dbReadTime}ms database read time, delaying ${delayMs}ms for next database read.`,
      );
      await delay(delayMs);
    }
    const finalTransactions = props.db
      .getTransactions()
      .filter((tx) => tx.owner_address == walletAddress);

    setSummary(generateSummary(finalTransactions));
    setAllTransactions(finalTransactions);
    filterTransactions(finalTransactions);
  }, []);

  function isDone() {
    return (
      props.downloader.downloadComplete ||
      props.downloader.stats.fullyCancelled ||
      props.downloader.stats.downloadingComplete
    );
  }

  function cancel() {
    props.downloader.cancel();
    setCancelled(true);
  }

  function resetFilters() {
    filterTransactions(allTransactions, getDefaultFilter());
  }

  useEffect(() => {
    if (router.query.walletAddress && !initialized) {
      setInitialized(true);
      readData(router.query.walletAddress as string);
    }
  }, [initialized, readData]);

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full">
        <div className="md:grid grid-flow-cols grid-cols-2 items-start">
          <SummaryTop
            cancel={() => cancel()}
            cancelled={cancelled}
            data={filteredSummary}
            done={isDone()}
            downloader={props.downloader}
          />
          <Filter
            allTransactions={allTransactions}
            data={summary}
            filter={filter}
            filterTransactions={(filter) =>
              filterTransactions(allTransactions, filter)
            }
            reset={() => resetFilters()}
            toggleUsd={() => setDisplayUsd(!displayUsd)}
          />
        </div>
        {Array.from(filteredSummary.quote.values()).map((summary) => (
          <QuoteTokenDisplay
            key={summary.token.mint}
            displayUsd={displayUsd}
            summary={summary}
          />
        ))}
      </div>
    </section>
  );
};
