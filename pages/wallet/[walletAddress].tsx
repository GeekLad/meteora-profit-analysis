import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { AppState } from "@/pages/_app";
import DefaultLayout from "@/layouts/default";
import {
  MeteoraPositionProfit,
  MeteoraUserProfit,
  getMeteoraUserProfit,
  profitSort,
} from "@/services/profit-downloader";
import { getMeteoraProfitForAccountOrSignature } from "@/services/profit-downloader";
import { ProfitDisplay } from "@/components/profit-display";
import { getDurationString } from "@/services/util";
import { FullPageSpinner } from "@/components/full-page-spinner";

export interface PositionLoadingState {
  startTime: number;
  durationString: string;
  durationHandler?: NodeJS.Timeout;
  signatureCount: number;
  allSignaturesFound: boolean;
  allPositionsFound: boolean;
  addressCheckCount: number;
  positionAddresses: string[];
  closedPositionAddresses: string[];
  profits: MeteoraPositionProfit[];
  userProfit: MeteoraUserProfit;
  checkPoints: {
    pctComplete: number;
    time: number;
  }[];
  positionProgress: number;
  eta: string;
  done: boolean;
}

export default function IndexPage() {
  const defaultUserProfit: MeteoraUserProfit = {
    pair_groups: [],
    pair_group_count: 0,
    pair_count: 0,
    position_count: 0,
    deposit_count: 0,
    deposits_usd: 0,
    withdraws_count: 0,
    withdraws_usd: 0,
    claimed_fees_usd: 0,
    claimed_rewards_usd: 0,
    most_recent_deposit_withdraw: 0,
    current_usd: 0,
    unclaimed_fees_usd: 0,
    unclaimed_rewards_usd: 0,
    balance_time_sum_product: 0,
    total_time: 0,
    total_time_days: 0,
    average_balance: 0,
    position_profit: 0,
    total_profit: 0,
    fee_points: 0,
    reward_points: 0,
    balance_points: 0,
    total_points: 0,
    total_fees_rewards_usd: 0,
    withdraws_and_current_usd: 0,
  };

  const defaultState: PositionLoadingState = {
    startTime: 0,
    durationString: "",
    signatureCount: 0,
    allSignaturesFound: false,
    allPositionsFound: false,
    addressCheckCount: 0,
    profits: [],
    userProfit: defaultUserProfit,
    checkPoints: [],
    positionProgress: -1,
    eta: "",
    positionAddresses: [],
    closedPositionAddresses: [],
    done: false,
  };

  const appState = useContext(AppState);
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [positionLoadingState, setPositionLoadingState] =
    useState(defaultState);

  function updatePositionLoadingState(currentState: PositionLoadingState) {
    currentState.durationString = getDurationString(
      new Date().getTime() - currentState.startTime,
    );

    if (!currentState.allPositionsFound) {
      return currentState;
    }

    const { addressCheckCount, positionAddresses, checkPoints } = currentState;

    const pctComplete = addressCheckCount / positionAddresses.length;

    currentState.positionProgress = Math.round(100 * pctComplete);

    const lastTime =
      checkPoints.length == 0
        ? new Date().getTime()
        : checkPoints[checkPoints.length - 1].time;

    if (checkPoints.length == 0 || new Date().getTime() - lastTime > 500) {
      checkPoints.push({
        pctComplete,
        time: new Date().getTime(),
      });
    }

    if (pctComplete < 0.1 || checkPoints.length < 30) {
      currentState.eta = "Calculating...";

      return currentState;
    }

    const first = checkPoints[0];
    const last = checkPoints[checkPoints.length - 1];
    const duration = last.time - first.time;
    const pctProgress = last.pctComplete - first.pctComplete;
    const estimate = duration / pctProgress - duration;

    currentState.eta = getDurationString(estimate);
    currentState.positionProgress = Math.round(100 * last.pctComplete);

    return currentState;
  }

  async function loadTransactions() {
    if (appState.connection) {
      setLoading(true);
      setPositionLoadingState(() => {
        return { ...defaultState, startTime: new Date().getTime() };
      });
      try {
        getMeteoraProfitForAccountOrSignature(
          appState.connection,
          router.query.walletAddress as string,
          {
            onSignaturesFound(signatureCount) {
              setPositionLoadingState((previousState) => {
                return updatePositionLoadingState({
                  ...previousState,
                  signatureCount,
                });
              });
            },
            onAllSignaturesFound() {
              setPositionLoadingState((previousState) => {
                return updatePositionLoadingState({
                  ...previousState,
                  allSignaturesFound: true,
                });
              });
            },
            onPositionFound(positionAddress) {
              setPositionLoadingState((previousState) => {
                if (
                  !previousState.positionAddresses.includes(positionAddress)
                ) {
                  previousState.positionAddresses.push(positionAddress);

                  return updatePositionLoadingState(previousState);
                }

                return previousState;
              });
            },
            onClosedPositionFound(positionAddress) {
              setPositionLoadingState((previousState) => {
                if (
                  !previousState.closedPositionAddresses.includes(
                    positionAddress,
                  )
                ) {
                  previousState.closedPositionAddresses.push(positionAddress);

                  return updatePositionLoadingState(previousState);
                }

                return previousState;
              });
            },
            onAllPositionsFound() {
              setPositionLoadingState((previousState) => {
                return updatePositionLoadingState({
                  ...previousState,
                  allPositionsFound: true,
                });
              });
            },
            onProfitAnalyzed(addressCheckCount, profit) {
              setPositionLoadingState((previousState) => {
                const profits = profitSort([...previousState.profits, profit]);
                const userProfit = getMeteoraUserProfit(profits);

                userProfit.pair_groups = profitSort(userProfit.pair_groups);

                return updatePositionLoadingState({
                  ...previousState,
                  addressCheckCount,
                  profits,
                  userProfit,
                });
              });
            },
            onOpenPositionUpdated(profit) {
              setPositionLoadingState((currentState) => {
                const existingProfit = currentState.profits.find(
                  (p) => p.position.address == profit.position.address,
                )!;
                const index = currentState.profits.indexOf(existingProfit);

                currentState.profits[index] = profit;
                currentState.userProfit = getMeteoraUserProfit(
                  currentState.profits,
                );

                return updatePositionLoadingState(currentState);
              });
            },
            onDone() {
              setLoading(false);
              setPositionLoadingState((previousState) => {
                return {
                  ...previousState,
                  done: true,
                };
              });
            },
          },
        );
      } catch (err) {
        setPositionLoadingState(defaultState);
      }
    }
  }

  useEffect(() => {
    if (router.query.walletAddress) {
      loadTransactions();
    }
  }, [router.query]);

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
export interface PositionLoadingState {
  startTime: number;
  durationString: string;
  durationHandler?: NodeJS.Timeout;
  signatureCount: number;
  allSignaturesFound: boolean;
  allPositionsFound: boolean;
  addressCheckCount: number;
  positionAddresses: string[];
  closedPositionAddresses: string[];
  profits: MeteoraPositionProfit[];
  userProfit: MeteoraUserProfit;
  checkPoints: {
    pctComplete: number;
    time: number;
  }[];
  positionProgress: number;
  eta: string;
  done: boolean;
}
