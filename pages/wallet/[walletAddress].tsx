import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { AppState } from "@/pages/_app";
import DefaultLayout from "@/layouts/default";
import { ProfitDisplay } from "@/components/profit-display";
import { getDurationString } from "@/services/util";
import { MeteoraPositionStream } from "@/services/MeteoraPositionStream";
import { FullPageSpinner } from "@/components/full-page-spinner";
import { MeteoraPositionTransaction } from "@/services/ParseMeteoraTransactions";
import { MeteoraPosition } from "@/services/MeteoraPosition";
import {
  JupiterTokenListToken,
  getJupiterTokenList,
} from "@/services/JupiterTokenList";

export interface PositionLoadingState {
  startTime: number;
  durationString: string;
  durationHandler?: NodeJS.Timeout;
  signatureCount: number;
  transactionCount: number;
  openPositionCount: number;
  allSignaturesFound: boolean;
  allPositionsFound: boolean;
  updatingOpenPositions: boolean;
  done: boolean;
  transactions: MeteoraPositionTransaction[];
  positions: MeteoraPosition[];
  tokenMap: Map<string, JupiterTokenListToken>;
}

export default function IndexPage() {
  const defaultState: PositionLoadingState = {
    startTime: 0,
    durationString: "",
    signatureCount: 0,
    transactionCount: 0,
    openPositionCount: 0,
    allSignaturesFound: false,
    allPositionsFound: false,
    updatingOpenPositions: false,
    done: false,
    transactions: [],
    positions: [],
    tokenMap: new Map(),
  };

  const appState = useContext(AppState);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [positionLoadingState, setPositionLoadingState] =
    useState(defaultState);

  function updateElapsedTime(currentState: PositionLoadingState) {
    currentState.durationString = getDurationString(
      new Date().getTime() - currentState.startTime,
    );

    return { ...currentState };
  }

  async function loadTransactions(walletAddress: string) {
    if (appState.connection) {
      setPositionLoadingState(() => {
        return { ...defaultState, startTime: new Date().getTime() };
      });

      const tokenMap = await getJupiterTokenList();

      setPositionLoadingState((currentState) => {
        return { ...currentState, tokenMap };
      });

      new MeteoraPositionStream(appState.connection, walletAddress).on(
        "data",
        (data) => {
          switch (data.type) {
            case "signatureCount":
              setPositionLoadingState((currentState) => {
                currentState.signatureCount = data.signatureCount;

                return updateElapsedTime(currentState);
              });
              break;

            case "allSignaturesFound":
              setPositionLoadingState((currentState) => {
                currentState.allSignaturesFound = true;

                return updateElapsedTime(currentState);
              });
              break;

            case "transactionCount":
              setPositionLoadingState((currentState) => {
                currentState.transactionCount = data.meteoraTransactionCount;

                return updateElapsedTime(currentState);
              });
              break;

            case "updatingOpenPositions":
              setPositionLoadingState((currentState) => {
                currentState.allPositionsFound = true;
                currentState.updatingOpenPositions = true;
                currentState.openPositionCount = data.openPositionCount;

                return updateElapsedTime(currentState);
              });
              break;

            case "positionsAndTransactions":
              setPositionLoadingState((currentState) => {
                currentState.done = true;
                currentState.updatingOpenPositions = false;
                currentState.transactions = data.transactions;
                currentState.positions = data.positions;

                return updateElapsedTime(currentState);
              });
              setLoading(false);
          }
        },
      );
    }
  }

  useEffect(() => {
    if (router.query.walletAddress) {
      loadTransactions(router.query.walletAddress as string);
    }
  }, [router.query.walletAddress]);

  if (loading && positionLoadingState.signatureCount == 0) {
    return <FullPageSpinner />;
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="w-full">
          <ProfitDisplay
            loading={loading}
            positionLoadingState={positionLoadingState}
          />
        </div>
      </section>
    </DefaultLayout>
  );
}
