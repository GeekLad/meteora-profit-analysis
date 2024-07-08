import { useState } from "react";
import { Button } from "@nextui-org/react";
import { Selection } from "@react-types/shared";

import { FilterIcon } from "./icons";
import { PositionDateRangePicker } from "./position-date-range-picker";
import { TokenSelector } from "./token-selector";

import {
  MeteoraPosition,
  filterPositionsByMintXAddress,
  filterPositionsByMintYAddress,
  filterPositionsByTimeMs,
} from "@/services/MeteoraPosition";
import { JupiterTokenListToken } from "@/services/JupiterTokenList";

export const QuoteTokenSummaryFilter = (props: {
  hidden?: boolean;
  positions: MeteoraPosition[];
  tokenMap: Map<string, JupiterTokenListToken>;
  onExpandToggle?: (expanded: boolean) => any;
  onFilter: (filteredPositions: MeteoraPosition[]) => any;
}) => {
  const defaultStart = new Date("2024-01-01").getTime();
  const defaultEnd = new Date().getTime() + 1000 * 60 * 60 * 24;
  const [initialized, setInitialized] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [dateFilteredPositions, setDateFilteredPositions] = useState(
    props.positions,
  );
  const [quoteFilteredPositions, setQuoteFilteredPositions] = useState(
    props.positions,
  );
  const [selectedQuoteTokens, setSelectedQuoteTokens] = useState(
    "all" as Selection,
  );
  const [selectedBaseTokens, setSelectedBaseTokens] = useState(
    "all" as Selection,
  );

  if (props.hidden) {
    return <></>;
  }

  function toggleExpand() {
    if (props.onExpandToggle) {
      props.onExpandToggle(!expanded);
      if (!initialized) {
        setInitialized(true);
        resetFilters();
      }
    }
    setExpanded(!expanded);
  }

  function resetFilters() {
    setStart(defaultStart);
    setEnd(defaultEnd);
    setSelectedQuoteTokens("all");
    setSelectedBaseTokens("all");
    applyAllFilters(defaultStart, defaultEnd, "all", "all");
  }

  function applyDateFilter(newStart: number, newEnd: number) {
    setStart(newStart);
    setEnd(newEnd);
    applyAllFilters(newStart, newEnd, selectedQuoteTokens, selectedBaseTokens);
  }

  function applyQuoteTokenFilter(newSelectedTokens: Selection) {
    setSelectedQuoteTokens(newSelectedTokens);
    applyAllFilters(start, end, newSelectedTokens, selectedBaseTokens);
  }

  function applyBaseTokenFilter(newSelectedTokens: Selection) {
    setSelectedBaseTokens(newSelectedTokens);
    applyAllFilters(start, end, selectedQuoteTokens, newSelectedTokens);
  }

  function applyAllFilters(
    newStart: number,
    newEnd: number,
    newSelectedQuoteTokens: Selection,
    newSelectedBaseTokens: Selection,
  ) {
    const dateFilteredPositions = filterPositionsByTimeMs(
      props.positions,
      newStart,
      newEnd,
    );

    setDateFilteredPositions(dateFilteredPositions);

    const quoteFilteredPositions =
      newSelectedQuoteTokens == "all"
        ? dateFilteredPositions
        : filterPositionsByMintYAddress(
            dateFilteredPositions,
            Array.from(newSelectedQuoteTokens) as string[],
          );

    setQuoteFilteredPositions(quoteFilteredPositions);

    const baseFilteredPositions =
      newSelectedBaseTokens == "all"
        ? quoteFilteredPositions
        : filterPositionsByMintXAddress(
            quoteFilteredPositions,
            Array.from(newSelectedBaseTokens) as string[],
          );

    props.onFilter(baseFilteredPositions);
  }

  return (
    <div>
      <div className="flex w-full justify-end">
        <Button
          aria-label="Filter results"
          className={!expanded ? "m-4" : "mr-4"}
          color="primary"
          startContent={<FilterIcon className="pt-2" size={40} />}
          onClick={() => toggleExpand()}
        >
          Filter Results
        </Button>
      </div>
      <div className="md:flex md:items-end">
        <PositionDateRangePicker
          end={end}
          hidden={!expanded}
          positions={props.positions}
          start={start}
          onFilter={(start, end) => applyDateFilter(start, end)}
        />
        <TokenSelector
          hidden={!expanded}
          positions={dateFilteredPositions}
          selectedItems={selectedQuoteTokens}
          tokenMap={props.tokenMap}
          onFilter={(selectedTokens) => applyQuoteTokenFilter(selectedTokens)}
        />
        <TokenSelector
          baseTokenList={true}
          hidden={!expanded}
          positions={quoteFilteredPositions}
          selectedItems={selectedBaseTokens}
          tokenMap={props.tokenMap}
          onFilter={(selectedTokens) => applyBaseTokenFilter(selectedTokens)}
        />
        {expanded ? (
          <div className="m-4">
            <Button
              aria-label="Reset Filters"
              hidden={!expanded}
              onClick={() => resetFilters()}
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};
