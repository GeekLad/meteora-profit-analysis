import { Button, Card, CardBody, Selection, Switch } from "@nextui-org/react";
import { useState } from "react";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

import { PositionStatusDropdown } from "./position-status";
import { HawksightDropdown } from "./hawksight";
import { DownloadCsvButton } from "./download-transactions";
import { DownloadDatabase } from "./download-database";

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
  reset: () => any;
  toggleUsd: () => any;
}) => {
  const [filterOn, setFilterOn] = useState(false);

  return (
    <Card className="md:mb-4 sm:mb-4 md:col-span-2">
      <CardBody className="md:grid grid-flow-cols grid-cols-6">
        <Switch className="my-4" onClick={() => props.toggleUsd()}>
          Display USD
        </Switch>
        <Switch
          className={`my-4${!filterOn ? "col-span-2" : ""}`}
          isSelected={filterOn}
          onClick={() => setFilterOn(!filterOn)}
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
        <span />
        {filterOn ? (
          <div className="md:flex md:justify-end">
            <Button
              className="w-1/2 my-4"
              color="danger"
              hidden={!filterOn}
              onClick={() => props.reset()}
            >
              Reset Filters
            </Button>
          </div>
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
        <PositionStatusDropdown
          hidden={!filterOn}
          status={props.filter.positionStatus}
          onFilter={(selectedStatus) =>
            props.filterTransactions({
              ...props.filter,
              positionStatus: selectedStatus,
            })
          }
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
