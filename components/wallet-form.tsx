import { Button, Input } from "@nextui-org/react";
import { useState } from "react";

import { AppStateInterface } from "@/pages/_app";

export const WalletForm = (props: {
  appState: AppStateInterface;
  loadTransactions: (walletAddress: string) => any;
}) => {
  const [walletAddress, setWalletAddress] = useState("");

  const onKeyUp = (key: string) => {
    if (key === "Enter") {
      props.loadTransactions(walletAddress);
    }
  };

  return (
    <div className="flex sm:w-full md:w-1/2 flex-col gap-4">
      <div className="flex w-full flex-wrap md:flex-nowrap mb-6 md:mb-0 gap-4">
        <Input
          label="Wallet or Transaction Address"
          type="text"
          onChange={(event) => setWalletAddress(event.target.value)}
          onKeyUp={(event) => onKeyUp(event.key)}
        />
        <Button
          aria-label="Go"
          color="primary"
          disabled={!props.appState.connection}
          onPress={() => props.loadTransactions(walletAddress)}
        >
          Go
        </Button>
      </div>
    </div>
  );
};
