import MeteoraDlmmDb, {
  MeteoraDlmmDbTransactions,
} from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import { useEffect, useState, useMemo, useCallback } from "react";
import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";
import { useRouter } from "next/router";

import { QuoteTokenDisplay } from "@/components/summary/quote-token-display";
import { Filter } from "@/components/summary/filter";
import { SummaryLeft } from "@/components/summary/left";
import { SummaryRight } from "@/components/summary/right";
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
  const [filter, setTransactionFilter] = useState({
    startDate: new Date("11/06/2023"),
    endDate: new Date(),
    positionStatus: "all" as "all" | "open" | "closed",
    baseTokenMints: new Set(initialTransactions.map((tx) => tx.base_mint)),
    quoteTokenMints: new Set(initialTransactions.map((tx) => tx.quote_mint)),
  });
  const [displayUsd, setDisplayUsd] = useState(false);

  const filterTransactions = useCallback(
    (transactions: MeteoraDlmmDbTransactions[], filter?: TransactionFilter) => {
      const transactionFilter = filter || {
        startDate: new Date("11/06/2023"),
        endDate: new Date(),
        positionStatus: "all" as "all" | "open" | "closed",
        baseTokenMints: new Set(transactions.map((tx) => tx.base_mint)),
        quoteTokenMints: new Set(transactions.map((tx) => tx.quote_mint)),
      };
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
        if (!transactionFilter.baseTokenMints.has(tx.base_mint)) return false;
        if (!transactionFilter.quoteTokenMints.has(tx.quote_mint)) return false;

        return true;
      });

      setFilteredSummary(generateSummary(filteredTransactions));
      setTransactionFilter(transactionFilter);
    },
    [],
  );

  const readData = useCallback(
    async (walletAddress: string) => {
      while (!isDone()) {
        const latestTransactions = props.db
          .getTransactions()
          .filter((tx) => tx.owner_address == walletAddress);

        setSummary(generateSummary(latestTransactions));
        filterTransactions(latestTransactions);
        await delay(2500);
      }
      const finalTransactions = props.db
        .getTransactions()
        .filter((tx) => tx.owner_address == walletAddress);

      setSummary(generateSummary(finalTransactions));
      filterTransactions(finalTransactions);
    },
    [props.db, filterTransactions],
  );

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
          <SummaryLeft
            data={filteredSummary}
            done={isDone()}
            downloader={props.downloader}
          />
          <SummaryRight
            cancel={() => cancel()}
            data={filteredSummary}
            done={isDone()}
            downloader={props.downloader}
          />
          <Filter
            allTransactions={allTransactions}
            filter={filter}
            filterTransactions={(filter) =>
              filterTransactions(allTransactions, filter)
            }
            toggleUsd={() => setDisplayUsd(!displayUsd)}
          />
        </div>
        {Array.from(summary.quote.values()).map((summary) => (
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
