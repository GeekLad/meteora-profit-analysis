"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Selection } from "@react-types/shared";
import { useState, useEffect } from "react";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

import { HawksightDropdown } from "./hawksight";
import { DownloadCsvButton } from "./download-transactions";
import { DownloadDatabase } from "./download-database";
import { ResetDatabase } from "./reset-database";

import { PositionDateRangePicker } from "@/components/summary/filter/date-range-picker";
import { TokenSelector } from "@/components/summary/filter/token-selector";
import {
  SummaryData,
  TransactionFilter,
} from "@/components/summary/generate-summary";

export const Filter = (props: {
  data: SummaryData;
  allTransactions: MeteoraDlmmDbTransactions[];
  done: boolean;
  filter: TransactionFilter;
  filterTransactions: (filter: TransactionFilter) => any;
  resetFilters: () => any;
  resetDatabase: () => any;
}) => {
  const [filterOn, setFilterOn] = useState(false);

  return (
    <Card className="mb-4 md:col-span-2">
      <CardBody className="md:grid grid-flow-cols grid-cols-6">
        <Switch
          className="my-4"
          isSelected={props.filter.displayUsd}
          onClickCapture={() =>
            props.filterTransactions({
              ...props.filter,
              displayUsd: !props.filter.displayUsd,
            })
          }
        >
          Display USD
        </Switch>
        <Switch
          className={`my-4${!filterOn ? "col-span-2" : ""}`}
          isSelected={filterOn}
          onClickCapture={() => {
            setFilterOn((filterOn) => !filterOn);
          }}
        >
          Display Filters
        </Switch>
        <DownloadDatabase
          allTransactions={props.allTransactions}
          done={props.done}
        />
        <DownloadCsvButton
          allTransactions={props.allTransactions}
          done={props.done}
          filter={props.filter}
        />
        <ResetDatabase resetDatabase={() => props.resetDatabase()} />
        {filterOn ? (
          <Button
            className="my-4"
            color="danger"
            hidden={!filterOn}
            onPress={() => props.resetFilters()}
          >
            Reset Filters
          </Button>
        ) : (
          <span />
        )}
        <PositionDateRangePicker
          aria-label="Select Position Date Range"
          end={props.filter.endDate}
          hidden={!filterOn}
          start={props.filter.startDate}
          onFilter={(startDate, endDate) => {
            props.filterTransactions({ ...props.filter, startDate, endDate });
          }}
        />
        <HawksightDropdown
          allTransactions={props.allTransactions}
          hidden={!filterOn}
          status={props.filter.hawksight}
          onFilter={(selectedStatus) =>
            props.filterTransactions({
              ...props.filter,
              hawksight: selectedStatus,
            })
          }
        />
        <TokenSelector
          allTransactions={props.allTransactions}
          baseTokenList={false}
          filter={props.filter}
          hidden={!filterOn}
          selectedItems={props.filter.quoteTokenMints}
          showTextFilter={false}
          onFilter={(selectedTokens: Selection) =>
            props.filterTransactions({
              ...props.filter,
              quoteTokenMints: selectedTokens as Set<string>,
            })
          }
        />
        <TokenSelector
          allTransactions={props.allTransactions}
          baseTokenList={true}
          filter={props.filter}
          hidden={!filterOn}
          selectedItems={props.filter.baseTokenMints}
          showTextFilter={true}
          onFilter={(selectedTokens: Selection) =>
            props.filterTransactions({
              ...props.filter,
              baseTokenMints: selectedTokens as Set<string>,
            })
          }
        />
      </CardBody>
    </Card>
  );
};
