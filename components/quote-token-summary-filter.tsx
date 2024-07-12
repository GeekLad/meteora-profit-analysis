import { useState } from "react";
import { Button, Switch, Tooltip } from "@nextui-org/react";
import { Selection } from "@react-types/shared";

import { FilterIcon } from "./icons";
import { PositionDateRangePicker } from "./position-date-range-picker";
import { TokenSelector } from "./token-selector";
import { PositionsDownloadButton } from "./positions-download-button";
import { TransactionsDownloadButton } from "./transactions-download-button";
import { HawksightSelector, HawksightSelectorItem } from "./hawksight-selector";
import {
  OpenPositionSelector,
  OpenPositionSelectorItem,
} from "./open-position-selector";

import {
  MeteoraPosition,
  filterPositionsByMintXAddress,
  filterPositionsByMintYAddress,
  filterPositionsByTimeMs,
} from "@/services/MeteoraPosition";
import { PositionLoadingState } from "@/pages/wallet/[walletAddress]";

export const defaultStart = new Date("2023-11-06").getTime();
export const defaultEnd = new Date().getTime() + 1000 * 60 * 60 * 24;

export const QuoteTokenSummaryFilter = (props: {
  hidden?: boolean;
  positionLoadingState: PositionLoadingState;
  usd: boolean;
  expanded: boolean;
  dates: {
    start: number;
    end: number;
  };
  onExpandToggle: (expanded: boolean) => any;
  onUsdToggle: () => any;
  onFilter: (filter: {
    dates: {
      start: number;
      end: number;
    };
    positions: MeteoraPosition[];
  }) => any;
}) => {
  const [initialized, setInitialized] = useState(false);
  const [hawksightSelection, setHawksightSelection] = useState(
    "allpositions" as HawksightSelectorItem,
  );
  const [openPositionSelection, setOpenPositionSelection] = useState(
    "allpositions" as OpenPositionSelectorItem,
  );
  const [dateFilteredPositions, setDateFilteredPositions] = useState(
    props.positionLoadingState.positions,
  );
  const [openPositionFilteredPositions, setOpenPositionFilteredPositions] =
    useState(props.positionLoadingState.positions);
  const [quoteFilteredPositions, setQuoteFilteredPositions] = useState(
    props.positionLoadingState.positions,
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
    props.onExpandToggle(!props.expanded);
    if (!initialized) {
      setInitialized(true);
      resetFilters();
    }
  }

  function resetFilters() {
    setOpenPositionSelection("allpositions");
    setSelectedQuoteTokens("all");
    setSelectedBaseTokens("all");
    setHawksightSelection("allpositions");
    applyAllFilters(
      defaultStart,
      defaultEnd,
      "allpositions",
      "all",
      "all",
      "allpositions",
    );
  }

  function applyDateFilter(newStart: number, newEnd: number) {
    applyAllFilters(
      newStart,
      newEnd,
      openPositionSelection,
      selectedQuoteTokens,
      selectedBaseTokens,
      hawksightSelection,
    );
  }

  function applyOpenPositionFilter(
    newOpenPositionSelection: OpenPositionSelectorItem,
  ) {
    setOpenPositionSelection(newOpenPositionSelection);
    applyAllFilters(
      props.dates.start,
      props.dates.end,
      newOpenPositionSelection,
      selectedQuoteTokens,
      selectedBaseTokens,
      hawksightSelection,
    );
  }

  function applyQuoteTokenFilter(newSelectedTokens: Selection) {
    setSelectedQuoteTokens(newSelectedTokens);
    applyAllFilters(
      props.dates.start,
      props.dates.end,
      openPositionSelection,
      newSelectedTokens,
      selectedBaseTokens,
      hawksightSelection,
    );
  }

  function applyBaseTokenFilter(newSelectedTokens: Selection) {
    setSelectedBaseTokens(newSelectedTokens);
    applyAllFilters(
      props.dates.start,
      props.dates.end,
      openPositionSelection,
      selectedQuoteTokens,
      newSelectedTokens,
      hawksightSelection,
    );
  }

  function applyHawksightFilter(newHawksightSelection: HawksightSelectorItem) {
    setHawksightSelection(newHawksightSelection);
    applyAllFilters(
      props.dates.start,
      props.dates.end,
      openPositionSelection,
      selectedQuoteTokens,
      selectedBaseTokens,
      newHawksightSelection,
    );
  }

  function applyAllFilters(
    newStart: number,
    newEnd: number,
    newOpenPositionSelection: OpenPositionSelectorItem,
    newSelectedQuoteTokens: Selection,
    newSelectedBaseTokens: Selection,
    newHawksightSelection: HawksightSelectorItem,
  ) {
    const dateFilteredPositions = filterPositionsByTimeMs(
      props.positionLoadingState.positions,
      newStart,
      newEnd,
    );

    setDateFilteredPositions(dateFilteredPositions);

    const openPositionFilteredPositions =
      newOpenPositionSelection == "allpositions"
        ? dateFilteredPositions
        : newOpenPositionSelection == "closed"
          ? dateFilteredPositions.filter((position) => position.isClosed)
          : dateFilteredPositions.filter((position) => !position.isClosed);

    setOpenPositionFilteredPositions(openPositionFilteredPositions);

    const quoteFilteredPositions =
      newSelectedQuoteTokens == "all"
        ? openPositionFilteredPositions
        : filterPositionsByMintYAddress(
            openPositionFilteredPositions,
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

    const hawksightFilteredPositions =
      newHawksightSelection == "allpositions"
        ? baseFilteredPositions
        : newHawksightSelection == "hawksightonly"
          ? baseFilteredPositions.filter((position) => position.isHawksight)
          : baseFilteredPositions.filter((position) => !position.isHawksight);

    props.onFilter({
      dates: {
        start: newStart,
        end: newEnd,
      },
      positions: hawksightFilteredPositions,
    });
  }

  return (
    <div className="col-span-3">
      {props.expanded ? (
        <div className="lg:grid grid-flow-cols grid-cols-8 items-end">
          <PositionDateRangePicker
            aria-label="Select Position Date Range"
            end={props.dates.end}
            hidden={!props.expanded}
            positions={props.positionLoadingState.positions}
            start={props.dates.start}
            onFilter={(start, end) => applyDateFilter(start, end)}
          />

          <OpenPositionSelector
            hidden={!props.expanded}
            positions={quoteFilteredPositions}
            selectedItem={openPositionSelection}
            onFilter={(newOpenPositionSelection) =>
              applyOpenPositionFilter(newOpenPositionSelection)
            }
          />

          <TokenSelector
            aria-label="Select Quote Tokens"
            hidden={!props.expanded}
            positions={openPositionFilteredPositions}
            selectedItems={selectedQuoteTokens}
            tokenMap={props.positionLoadingState.tokenMap}
            onFilter={(selectedTokens) => applyQuoteTokenFilter(selectedTokens)}
          />

          <TokenSelector
            aria-label="Select Base Tokens"
            baseTokenList={true}
            hidden={!props.expanded}
            positions={quoteFilteredPositions}
            selectedItems={selectedBaseTokens}
            tokenMap={props.positionLoadingState.tokenMap}
            onFilter={(selectedTokens) => applyBaseTokenFilter(selectedTokens)}
          />

          <HawksightSelector
            hidden={!props.expanded}
            positions={quoteFilteredPositions}
            selectedItem={hawksightSelection}
            onFilter={(newHawksightSelection) =>
              applyHawksightFilter(newHawksightSelection)
            }
          />

          <Button
            aria-label="Reset Filters"
            className="m-4"
            hidden={!props.expanded}
            onClick={() => resetFilters()}
          >
            Reset Filters
          </Button>

          <Button
            aria-label="Close Filters"
            className="m-4"
            color="primary"
            onClick={() => props.onExpandToggle(!props.expanded)}
          >
            Close Filters
          </Button>
        </div>
      ) : (
        <div className="md:grid md:mr-4 grid-flow-cols grid-cols-4 items-end">
          <TransactionsDownloadButton
            hidden={props.expanded}
            positionLoadingState={props.positionLoadingState}
          />
          <PositionsDownloadButton
            hidden={props.expanded}
            positionLoadingState={props.positionLoadingState}
          />

          <Button
            aria-label="Filter results"
            className="m-4"
            color="primary"
            startContent={<FilterIcon className="pt-2" size={40} />}
            onClick={() => toggleExpand()}
          >
            Filter Results
          </Button>
          <div className="m-4 flex w-full justify-end items-end">
            <Tooltip
              color="warning"
              content="Note: Data is missing, USD values are not fully loaded in yet"
              isDisabled={props.positionLoadingState.apiDataLoaded}
            >
              <Switch
                aria-label="Toggle USD"
                className="mr-4"
                isSelected={props.usd}
                onClick={() => props.onUsdToggle()}
              >
                Show USD
              </Switch>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};
