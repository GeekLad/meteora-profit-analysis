import { DateRangePicker, RangeValue } from "@nextui-org/react";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
} from "@internationalized/date";

export const PositionDateRangePicker = (props: {
  hidden?: boolean;
  start: Date;
  end: Date;
  onFilter: (start: Date, end: Date) => any;
}) => {
  const dateRange = {
    start: parseDate(props.start.toISOString().substring(0, 10)),
    end: parseDate(props.end.toISOString().substring(0, 10)),
  } as RangeValue<CalendarDate>;

  if (props.hidden) {
    return <></>;
  }

  function updateDates(range: RangeValue<CalendarDate>) {
    if (range && range.end && range.start) {
      const start = range.start.toDate(getLocalTimeZone());
      const end = range.end.toDate(getLocalTimeZone());

      props.onFilter(start, end);
    }
  }

  return (
    <div className="max-w-sm whitespace-nowrap col-span-2">
      <DateRangePicker
        aria-label="Transaction Date Range"
        label="Transaction Date Range"
        value={dateRange}
        onChange={(range) => updateDates(range)}
      />
    </div>
  );
};