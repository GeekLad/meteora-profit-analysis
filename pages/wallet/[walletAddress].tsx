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
import { UsdMeteoraPositionStream } from "@/services/UsdMeteoraPositionStream";

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
  rpcDataLoaded: boolean;
  apiDataLoaded: boolean;
  transactions: MeteoraPositionTransaction[];
  positions: MeteoraPosition[];
  tokenMap: Map<string, JupiterTokenListToken>;
  updatingUsdValues: boolean;
  updatedUsdValueCount: number;
  updatedUsdPercent: number;
  usdUpdateStartTime: number;
  estimatedCompletionString: string;
  cancel?: () => any;
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
    rpcDataLoaded: false,
    apiDataLoaded: false,
    transactions: [],
    positions: [],
    tokenMap: new Map(),
    updatingUsdValues: false,
    updatedUsdValueCount: 0,
    updatedUsdPercent: 0,
    usdUpdateStartTime: 0,
    estimatedCompletionString: "",
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

    if (currentState.updatedUsdPercent > 0) {
      if (currentState.updatedUsdPercent < 0.05) {
        currentState.estimatedCompletionString = "";
      } else {
        const elapsedMs =
          new Date().getTime() - currentState.usdUpdateStartTime;
        const eta =
          elapsedMs / (currentState.updatedUsdPercent / 100) - elapsedMs;

        currentState.estimatedCompletionString = getDurationString(eta);
      }
    }

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

      const meteoraPositionStream = new MeteoraPositionStream(
        appState.connection,
        walletAddress,
        undefined,
        undefined,
        new Date("11/6/2023"),
      )
        .on("data", (data) => {
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

            case "positionAndTransactions":
              setPositionLoadingState((currentState) => {
                currentState.transactions = currentState.transactions.concat(
                  data.transactions,
                );
                currentState.positions.push(data.position);

                return updateElapsedTime(currentState);
              });
              setLoading(false);
          }
        })
        .on("end", () => {
          loadApiData();
        });

      setPositionLoadingState((currentState) => {
        return {
          ...currentState,
          cancel: () => {
            meteoraPositionStream!.cancel();
            loadApiData();
          },
        };
      });
    }
  }

  async function loadApiData() {
    setPositionLoadingState((currentState) => {
      currentState.allSignaturesFound = true;
      currentState.allPositionsFound = true;
      currentState.rpcDataLoaded = true;
      currentState.usdUpdateStartTime = new Date().getTime();
      currentState.updatingUsdValues = true;

      new UsdMeteoraPositionStream(currentState.positions)
        .on("data", (data) => {
          setPositionLoadingState((currentState) => {
            const oldPosition = currentState.positions.find(
              (position) => position.position == data.updatedPosition.position,
            )!;
            const index = currentState.positions.indexOf(oldPosition);

            currentState.positions[index] = data.updatedPosition;
            currentState.updatedUsdValueCount = data.updatedPositionCount;

            currentState.updatedUsdPercent =
              (100 * data.updatedPositionCount) / currentState.positions.length;

            return updateElapsedTime(currentState);
          });
        })
        .on("end", () => {
          setPositionLoadingState((currentState) => {
            currentState.apiDataLoaded = true;

            return updateElapsedTime(currentState);
          });
        });

      return updateElapsedTime(currentState);
    });
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
