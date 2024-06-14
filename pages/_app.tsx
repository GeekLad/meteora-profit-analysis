import type { AppProps } from "next/app";

import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { Dispatch, SetStateAction, createContext, useState } from "react";
import { useRouter } from "next/router";
import { Connection } from "@solana/web3.js";

import { fontSans, fontMono } from "@/config/fonts";
import "@/styles/globals.css";
import { RPC_URL } from "@/services/config";

export interface AppStateInterface {
  rpc: string;
  connection: Connection | undefined;
  verifyingRpc: boolean;
  updateRpc: (newRpc: string) => void;
  transactionCount: number;
  setTransactionCount: Dispatch<SetStateAction<number>>;
}
export const AppState = createContext({} as AppStateInterface);

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [rpc, setRpc] = useState(RPC_URL);
  const [connection, setConnection] = useState(
    new Connection(RPC_URL) as Connection | undefined,
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
    <AppState.Provider
      value={{
        rpc,
        connection,
        verifyingRpc,
        updateRpc,
        transactionCount,
        setTransactionCount,
      }}
    >
      <NextUIProvider navigate={router.push}>
        <NextThemesProvider>
          <Component {...pageProps} />
        </NextThemesProvider>
      </NextUIProvider>
    </AppState.Provider>
  );
}

export const fonts = {
  sans: fontSans.style.fontFamily,
  mono: fontMono.style.fontFamily,
};
