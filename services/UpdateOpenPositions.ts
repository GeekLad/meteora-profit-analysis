import type { MeteoraPosition } from "./MeteoraPosition";

import DLMM, { type LbPosition } from "@meteora-ag/dlmm";
import { PublicKey, type Connection } from "@solana/web3.js";

import { unique } from "./util";

function createDlmms(connection: Connection, pairAddresses: string[]) {
  const pubKeys = pairAddresses.map(
    (pairAddress) => new PublicKey(pairAddress),
  );

  return DLMM.createMultiple(connection, pubKeys);
}

function updateOpenPosition(
  openPosition: MeteoraPosition,
  userPosition: LbPosition,
  poolPrice: number,
) {
  const { mintXDecimals, mintYDecimals } = openPosition;
  const deposits = openPosition.transactions.filter(
    (position) => position.open,
  );
  const lastDeposit = deposits[deposits.length - 1];
  const price =
    (openPosition.inverted ? 1 / poolPrice : poolPrice) *
    10 ** (mintXDecimals - mintYDecimals);
  const xAmount =
    Number(
      !openPosition.inverted
        ? userPosition.positionData.totalXAmount
        : userPosition.positionData.totalYAmount,
    ) /
    10 ** openPosition.mintXDecimals;
  const yAmount =
    Number(
      !openPosition.inverted
        ? userPosition.positionData.totalYAmount
        : userPosition.positionData.totalXAmount,
    ) /
    10 ** openPosition.mintYDecimals;

  const xFee =
    (!openPosition.inverted
      ? userPosition.positionData.feeX.toNumber()
      : userPosition.positionData.feeY.toNumber()) /
    10 ** mintXDecimals;
  const yFee =
    (!openPosition.inverted
      ? userPosition.positionData.feeY.toNumber()
      : userPosition.positionData.feeX.toNumber()) /
    10 ** mintYDecimals;

  lastDeposit.mintXOpenBalance = openPosition.floorX(
    openPosition.totalXWithdraws + xAmount,
  );
  lastDeposit.mintYOpenBalance = openPosition.floorY(
    openPosition.totalYWithdraws + yAmount,
  );
  lastDeposit.openBalanceValue = openPosition.floorY(
    price * lastDeposit.mintXOpenBalance + lastDeposit.mintYOpenBalance,
  );
  lastDeposit.mintXUnclaimedFees = openPosition.floorX(
    openPosition.totalXFees + xFee,
  );
  lastDeposit.mintYUnclaimedFees = openPosition.floorY(
    openPosition.totalYFees + yFee,
  );
  lastDeposit.unclaimedFeesValue = openPosition.floorY(
    price * lastDeposit.mintXUnclaimedFees + lastDeposit.mintYUnclaimedFees,
  );
  lastDeposit.timestamp_ms = new Date().getTime();

  openPosition.summarizeTransactions();
  openPosition.calcTotals();
  openPosition.calcPrices();
}

async function updateOpenPositionsWithDlmmPools(
  pool: DLMM,
  openPositions: MeteoraPosition[],
) {
  const { activeBin, userPositions } = await pool.getPositionsByUserAndLbPair(
    new PublicKey(openPositions[0].sender),
  );
  const poolPrice = Number(activeBin.price);

  userPositions.forEach((userPosition) => {
    const openPosition = openPositions.find(
      (openPosition) =>
        openPosition.position == userPosition.publicKey.toBase58(),
    );

    if (openPosition) {
      updateOpenPosition(openPosition, userPosition, poolPrice);
    } else {
      console.warn(
        `Position ${userPosition.publicKey.toBase58()} was found in DLMM pool, but was not found in transactions`,
      );
    }
  });
}

export async function updateOpenPositions(
  connection: Connection,
  positions: MeteoraPosition[],
) {
  const openPositions = positions.filter((position) => !position.isClosed);

  if (openPositions.length > 0) {
    const pairAddresses = unique(
      openPositions.map((position) => position.lbPair),
    );
    const pools = await createDlmms(connection, pairAddresses);

    await Promise.all(
      pools.map((pool) =>
        updateOpenPositionsWithDlmmPools(pool, openPositions),
      ),
    );
  }
}
