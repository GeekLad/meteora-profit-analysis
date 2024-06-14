import { Spinner } from "@nextui-org/react";

export const LoadingItem = (props: {
  title: string;
  value: number | string;
  loading?: boolean;
}) => {
  return (
    <div className="flex columns-2 w-full">
      <div className="text-nowrap">
        {props.loading ? (
          <Spinner size="sm" />
        ) : props.loading === false ? (
          "✅"
        ) : (
          ""
        )}
        &nbsp;
        <b>{props.title}: &nbsp;</b>
      </div>
      <div className="ml-auto">
        {typeof props.value == "number"
          ? props.value.toLocaleString("en-us", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })
          : props.value}
      </div>
    </div>
  );
};
