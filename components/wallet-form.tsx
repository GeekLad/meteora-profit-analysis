import { Button, Input } from "@nextui-org/react";
import { ChangeEvent } from "react";

import { AppStateInterface } from "@/pages/_app";

export const WalletForm = (props: {
  loading: boolean;
  appState: AppStateInterface;
  onChange: (event: ChangeEvent<HTMLInputElement>) => any;
  loadTransactions: () => any;
}) => {
  if (props.loading) {
    return <></>;
  }

  return (
    <div className="flex sm:w-full md:w-1/2 flex-col gap-4">
      <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
        <Input
          disabled={props.loading}
          label="Wallet Address or Transaction Signature"
          type="text"
          onChange={(event) => props.onChange(event)}
        />
        <Button
          aria-label="Go"
          color="primary"
          disabled={props.loading || !props.appState.connection}
          onClick={props.loadTransactions}
        >
          Go
        </Button>
      </div>
    </div>
  );
};
