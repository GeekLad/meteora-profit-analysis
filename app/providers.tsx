"use client";

import {
  type ThemeProviderProps,
  ThemeProvider as NextThemesProvider,
} from "next-themes";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { Connection } from "@solana/web3.js";
import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

declare module "@react-types/shared" {
  interface RouterConfig {
    routerOptions: NonNullable<
      Parameters<ReturnType<typeof useRouter>["push"]>[1]
    >;
  }
}

const RPC_URL = "https://grateful-jerrie-fast-mainnet.helius-rpc.com";

export interface AppStateInterface {
  rpc: string;
  connection: Connection | undefined;
  verifyingRpc: boolean;
  updateRpc: (newRpc: string) => void;
  transactionCount: number;
  setTransactionCount: Dispatch<SetStateAction<number>>;
}

// use either {} as AppStateInterface or AppStateInterface | undefined
export const AppStateContext = createContext<AppStateInterface | undefined>(
  undefined
);

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  const [rpc, setRpc] = useState(RPC_URL);
  const [connection, setConnection] = useState(
    new Connection(RPC_URL) as Connection | undefined
  );
  const [verifyingRpc, setVerifyingRpc] = useState(true);
  const [transactionCount, setTransactionCount] = useState(0);

  async function checkRpc(rpc: string) {
    if (rpc.match(/^https:\/\//)) {
      try {
        const connection = new Connection(rpc);

        await connection.getLatestBlockhash();

        setConnection(connection);
      } catch (err) {
        setConnection(undefined);
      }
    } else {
      setConnection(undefined);
    }
    setVerifyingRpc(false);
  }

  function updateRpc(newRpc: string) {
    setRpc(newRpc);
    setVerifyingRpc(true);
    setConnection(undefined);
    checkRpc(newRpc);
  }

  return (
    <HeroUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <AppStateContext.Provider
          value={{
            rpc,
            connection,
            verifyingRpc,
            updateRpc,
            transactionCount,
            setTransactionCount,
          }}
        >
          {children}
        </AppStateContext.Provider>
      </NextThemesProvider>
    </HeroUIProvider>
  );
}

// Custom hook to use the AppContext only
export const useAppStateContext = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppStateContext must be used within the Provider");
  }

  return context;
};
