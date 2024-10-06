import { Card, CardBody, Selection, Switch } from "@nextui-org/react";
import { useState } from "react";

import { PositionDateRangePicker } from "@/components/summary/filter/date-range-picker";
import { TokenSelector } from "@/components/summary/filter/token-selector";
import {
  SummaryData,
  TransactionFilter,
} from "@/components/summary/generate-summary";

export const Filter = (props: {
  data: SummaryData;
  filter: TransactionFilter;
  filterTransactions: (filter: TransactionFilter) => any;
  toggleUsd: () => any;
}) => {
  const [filterOn, setFilterOn] = useState(false);

  return (
    <Card className="md:mb-4 sm:mb-4 md:col-span-2">
      <CardBody className="md:grid grid-flow-cols grid-cols-5">
        <Switch className="sm:mb-4" onClick={() => props.toggleUsd()}>
          Display USD
        </Switch>
        <Switch
          className="sm:mb-4 col-span-4"
          isSelected={filterOn}
          onClick={() => setFilterOn(!filterOn)}
        >
          Display Filters
        </Switch>
        <PositionDateRangePicker
          aria-label="Select Position Date Range"
          end={props.filter.endDate}
          hidden={!filterOn}
          start={props.filter.startDate}
          onFilter={(startDate, endDate) => {
            props.filterTransactions({ ...props.filter, startDate, endDate });
          }}
        />
        <TokenSelector
          baseTokenList={false}
          data={props.data}
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
          baseTokenList={true}
          data={props.data}
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
