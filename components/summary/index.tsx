import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { FullPageSpinner } from "../full-page-spinner";

import { QuoteTokenDisplay } from "@/components/summary/quote-token-display";
import { Filter } from "@/components/summary/filter";
import {
  generateSummary,
  TransactionFilter,
  applyFilter,
  SummaryData,
} from "@/components/summary/generate-summary";
import { SummaryTop } from "@/components/summary/top";
import { DataWorkerMessage } from "@/public/workers/download-worker";

export const Summary = (props: { downloadWorker: Worker }) => {
  const router = useRouter();

  const [stats, setStats] = useState<MeteoraDlmmDownloaderStats>({
    downloadingComplete: false,
    positionsComplete: false,
    transactionDownloadCancelled: false,
    fullyCancelled: false,
    secondsElapsed: 0,
    accountSignatureCount: 0,
    oldestTransactionDate: new Date(),
    positionTransactionCount: 0,
    positionCount: 0,
    usdPositionCount: 0,
    missingUsd: 0,
  });
  const [allTransactions, setAllTransactions] = useState<
    MeteoraDlmmDbTransactions[]
  >([]);
  const [summary, setSummary] = useState<SummaryData>(generateSummary([]));
  const [filteredSummary, setFilteredSummary] = useState<SummaryData>(
    generateSummary([]),
  );
  const start = useMemo(() => Date.now(), [router.query.walletAddress]);
  const [initialized, setInitialized] = useState(false);
  const [duration, setDuration] = useState(0);
  const [done, setDone] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [filter, setFilter] = useState<TransactionFilter | undefined>(
    undefined,
  );
  const [quoteTokenDisplay, setQuoteTokenDisplay] = useState<JSX.Element[]>([]);

  const getDefaultFilter = useCallback(
    (
      transactions: MeteoraDlmmDbTransactions[] = allTransactions,
    ): TransactionFilter => {
      return {
        startDate:
          transactions.length > 0
            ? new Date(
                Math.min(...transactions.map((tx) => tx.block_time * 1000)),
              )
            : new Date("11/06/2023"),
        endDate:
          transactions.length > 0
            ? new Date(
                Math.max(...transactions.map((tx) => tx.block_time * 1000)),
              )
            : new Date(Date.now() + 1000 * 60 * 60 * 24),
        positionStatus: "all",
        hawksight: "include",
        baseTokenMints: new Set(transactions.map((tx) => tx.base_mint)),
        quoteTokenMints: new Set(transactions.map((tx) => tx.quote_mint)),
        displayUsd: false,
      };
    },
    [allTransactions],
  );

  const filterTransactions = useCallback(
    (
      transactions: MeteoraDlmmDbTransactions[],
      updatedFilter?: TransactionFilter,
      reset = false,
    ) => {
      setFilter((prevFilter) => {
        const newFilter = !reset
          ? {
              ...(prevFilter || getDefaultFilter(transactions)),
              ...updatedFilter,
            }
          : getDefaultFilter();

        const filteredTransactions = applyFilter(transactions, newFilter);
        const filteredSummary = generateSummary(filteredTransactions);

        setFilteredSummary(filteredSummary);
        updateQuoteTokenDisplay(filteredSummary, newFilter.displayUsd);

        return updatedFilter;
      });
    },
    [getDefaultFilter],
  );

  const updateQuoteTokenDisplay = useCallback(
    (summary: SummaryData, displayUsd: boolean) => {
      setQuoteTokenDisplay(
        Array.from(summary.quote.values()).map((s) => (
          <QuoteTokenDisplay
            key={s.token.mint}
            displayUsd={displayUsd}
            summary={s}
          />
        )),
      );
    },
    [],
  );

  const cancel = useCallback(() => {
    props.downloadWorker.postMessage("cancel");
    setCancelled(true);
  }, [props.downloadWorker]);

  const resetFilters = useCallback(() => {
    filterTransactions(allTransactions, undefined, true);
  }, [allTransactions, filterTransactions, getDefaultFilter]);

  function resetDatabase() {
    props.downloadWorker.postMessage("reset");
  }

  const update = useCallback(
    (event: MessageEvent<DataWorkerMessage>) => {
      if (typeof event.data == "string") {
        if (event.data == "reset") {
          window.location.reload();

          return;
        }
        throw new Error(
          `Received unexpected message "${event.data}" from download worker!`,
        );
      }
      if (event.data.stats.downloadingComplete) {
        setDone(true);
      }
      const { transactions, stats } = event.data;

      if (transactions.length > 0) {
        setStats(stats);
        setSummary(generateSummary(transactions));
        setAllTransactions(transactions);
        if (!initialized) {
          setInitialized(true);
        }
        filterTransactions(transactions, filter);
      }
    },
    [filterTransactions, getDefaultFilter, initialized, filter],
  );

  useEffect(() => {
    if (router.query.walletAddress) {
      props.downloadWorker.onmessage = update;

      const durationHandle = setInterval(() => {
        setDuration(Date.now() - start);
      }, 1000);

      return () => {
        if (done) {
          clearInterval(durationHandle);
        }
      };
    }
  }, [router.query.walletAddress, props.downloadWorker, start, done, update]);

  if (!initialized) {
    return <FullPageSpinner excludeLayout={true} />;
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="w-full">
        <div className="md:grid grid-flow-cols grid-cols-2 items-start">
          <SummaryTop
            cancel={cancel}
            cancelled={cancelled}
            data={filteredSummary}
            done={done}
            duration={duration}
            stats={stats}
          />
          <Filter
            allTransactions={allTransactions}
            data={summary}
            done={done}
            filter={filter || getDefaultFilter()}
            filterTransactions={(newFilter) =>
              filterTransactions(allTransactions, newFilter)
            }
            resetDatabase={resetDatabase}
            resetFilters={resetFilters}
          />
        </div>
        {quoteTokenDisplay}
        <div>&nbsp;</div>
      </div>
    </section>
  );
};
