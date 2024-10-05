import { Card, CardBody, Switch } from "@nextui-org/react";
import { useState } from "react";

import { PositionDateRangePicker } from "./date-range-picker";

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
          onFilter={() => console.log("TODO: Implement date filter")}
        />
      </CardBody>
    </Card>
  );
};
