import { Card, CardBody } from "@nextui-org/react";

export const NoResultsFound = () => {
  return (
    <Card>
      <CardBody>
        <div className="text-4xl text-center">No Results Found</div>
        <br />
        <div className="text-xl text-center md:m-4">
          Please provide a valid wallet address or transaction signature.
        </div>
      </CardBody>
    </Card>
  );
};
