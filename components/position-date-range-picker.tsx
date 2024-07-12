import { DateRangePicker, RangeValue } from "@nextui-org/react";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date";

import { MeteoraPosition } from "@/services/MeteoraPosition";

export const PositionDateRangePicker = (props: {
  hidden?: boolean;
  positions: MeteoraPosition[];
  start: number;
  end: number;
  onFilter: (start: number, end: number) => any;
}) => {
  const dateRange = {
    start: parseDate(new Date(props.start).toISOString().substring(0, 10)),
    end: parseDate(new Date(props.end).toISOString().substring(0, 10)),
  } as RangeValue<CalendarDate>;

  if (props.hidden) {
    return <></>;
  }

  function updateDates(range: RangeValue<CalendarDate>) {
    if (range && range.end && range.start) {
      const start = range.start.toDate(getLocalTimeZone()).getTime();
      const end = range.end.toDate(getLocalTimeZone()).getTime();

      props.onFilter(start, end);
    }
  }

  return (
    <div className="m-4 max-w-sm whitespace-nowrap col-span-2">
      <DateRangePicker
        aria-label="Position Date Range"
        label="Position Date Range"
        value={dateRange}
        onChange={(range) => updateDates(range)}
      />
    </div>
  );
};
