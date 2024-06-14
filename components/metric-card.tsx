import { Card, CardBody, CardFooter } from "@nextui-org/react";

export const MetricCard = (props: { value: number; label: string }) => {
  return (
    <Card className="m-4 w-auto h-fit">
      <CardBody>
        <div className="text-3xl font-bold">
          {props.value.toLocaleString("en-US", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}
        </div>
      </CardBody>
      <CardFooter>{props.label}</CardFooter>
    </Card>
  );
};
