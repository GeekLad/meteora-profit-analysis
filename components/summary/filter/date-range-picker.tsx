"use client";

import { Button, ButtonGroup } from "@heroui/button";
import { RangeValue } from "@nextui-org/react";
import { DateRangePicker } from "@heroui/date-picker";
import {
  CalendarDate,
  getLocalTimeZone,
  parseDate,
  CalendarDateTime,
  ZonedDateTime,
  DateValue,
} from "@internationalized/date";
import { useState } from "react";
import { useDateFormatter } from "@react-aria/i18n";

interface RangeInterface {
  start:
    | RangeValue<DateValue | CalendarDate | CalendarDateTime | ZonedDateTime>
    | undefined
    | null;
  end:
    | RangeValue<DateValue | CalendarDate | CalendarDateTime | ZonedDateTime>
    | undefined
    | null;
}

export const PositionDateRangePicker = (props: {
  hidden?: boolean;
  start: Date;
  end: Date;
  onFilter: (start: Date, end: Date) => any;
}) => {
  const [value, setValue] = useState({
    start: parseDate(props.start.toISOString().substring(0, 10)),
    end: parseDate(props.end.toISOString().substring(0, 10)),
  });
  let formatter = useDateFormatter({ dateStyle: "long" });

  const today = {
    start: parseDate(new Date(Date.now()).toISOString().substring(0, 10)),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    ),
  };

  const last7Days = {
    start: parseDate(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 7)
        .toISOString()
        .substring(0, 10)
    ),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    ),
  };

  const last30Days = {
    start: parseDate(
      new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
        .toISOString()
        .substring(0, 10)
    ),
    end: parseDate(
      new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().substring(0, 10)
    ),
  };

  const [showCalendar, setShowCalendar] = useState(false);

  if (props.hidden) {
    return <></>;
  }
  function updateDates(range: RangeInterface, closeCalendar = false) {
    if (range && range.end && range.start) {
      const start = range.start.toDate(getLocalTimeZone());
      const end = range.end.toDate(getLocalTimeZone());

      props.onFilter(start, end);
      if (closeCalendar) {
        setShowCalendar(false);
      }
    }
  }

  return (
    <div className="md:mr-4 my-4 max-w-sm whitespace-nowrap col-span-2">
      <DateRangePicker
        CalendarTopContent={
          <ButtonGroup>
            <Button color="primary" onPress={() => updateDates(today, true)}>
              Today
            </Button>
            <Button
              color="primary"
              onPress={() => updateDates(last7Days, true)}
            >
              Last 7 Days
            </Button>
            <Button
              color="primary"
              onPress={() => updateDates(last30Days, true)}
            >
              Last 30 Days
            </Button>
          </ButtonGroup>
        }
        aria-label="Transaction Date Range"
        isOpen={showCalendar}
        label="Transaction Date Range"
        // todo: unsure of the type (?)
        value={value}
        onChange={(range) => {
          if (range != null) {
            updateDates(range);
          }
        }}
        onOpenChange={(isOpen) => setShowCalendar(isOpen)}
      />
    </div>
  );
};
