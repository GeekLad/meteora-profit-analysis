import type { MeteoraPosition } from "./MeteoraPosition";

import DLMM, { type LbPosition } from "@meteora-ag/dlmm";
import { PublicKey, type Connection } from "@solana/web3.js";

import { unique } from "./util";
import { getPrices } from "./JupiterPriceApi";

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
  const deposits = openPosition.transactions.filter((position) => position.add);
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
    10 ** mintXDecimals;
  const yAmount =
    Number(
      !openPosition.inverted
        ? userPosition.positionData.totalYAmount
        : userPosition.positionData.totalXAmount,
    ) /
    10 ** mintYDecimals;

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

  lastDeposit.mintXOpenBalance = openPosition.floorX(xAmount);
  lastDeposit.mintYOpenBalance = openPosition.floorY(yAmount);
  lastDeposit.openBalanceValue = openPosition.floorY(
    price * lastDeposit.mintXOpenBalance + lastDeposit.mintYOpenBalance,
  );
  lastDeposit.mintXUnclaimedFees = openPosition.floorX(xFee);
  lastDeposit.mintYUnclaimedFees = openPosition.floorY(yFee);
  lastDeposit.unclaimedFeesValue = openPosition.floorY(
    price * lastDeposit.mintXUnclaimedFees + lastDeposit.mintYUnclaimedFees,
  );
  lastDeposit.timestamp_ms = new Date().getTime();
}

async function getPositions(pool: DLMM, openPositions: MeteoraPosition[]) {
  const uniqueSenders = unique(
    openPositions.map((position) => position.sender),
  );

  const positionData = await Promise.all(
    uniqueSenders.map((sender) =>
      pool.getPositionsByUserAndLbPair(new PublicKey(sender)),
    ),
  );

  const activeBin = positionData[0].activeBin;
  const userPositions = positionData
    .map((position) => position.userPositions)
    .flat();

  return { activeBin, userPositions };
}

async function updateOpenPositionsWithDlmmPools(
  pool: DLMM,
  openPositions: MeteoraPosition[],
) {
  const { activeBin, userPositions } = await getPositions(pool, openPositions);
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

async function updateUsdValues(openPositions: MeteoraPosition[]) {
  const uniqueMints = openPositions
    .map((position) => [position.mintX, position.mintY])
    .flat()
    .filter((address) => address != null);

  const priceMap = await getPrices(uniqueMints);

  openPositions.forEach((position) => {
    const tokenXUsdPrice = priceMap.get(position.mintX)?.price;
    const tokenYUsdPrice = priceMap.get(position.mintY)?.price;

    if (tokenXUsdPrice && tokenYUsdPrice) {
      const transactions = position.transactions.filter(
        (transaction) => transaction.add,
      );

      if (transactions.length > 0) {
        const lastAdd = transactions[transactions.length - 1];

        lastAdd.usdMintXOpenBalance = lastAdd.mintXOpenBalance * tokenXUsdPrice;
        lastAdd.usdMintYOpenBalance = lastAdd.mintYOpenBalance * tokenYUsdPrice;
        lastAdd.usdOpenBalanceValue =
          lastAdd.usdMintXOpenBalance + lastAdd.usdMintYOpenBalance;
        lastAdd.usdMintXUnclaimedFees =
          lastAdd.mintXUnclaimedFees * tokenXUsdPrice;
        lastAdd.usdMintYUnclaimedFees =
          lastAdd.mintYUnclaimedFees * tokenYUsdPrice;
        lastAdd.usdUnclaimedFeesValue =
          lastAdd.usdMintXUnclaimedFees + lastAdd.usdMintYUnclaimedFees;
      }
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
    await updateUsdValues(openPositions);
    openPositions.forEach((position) => position.updateValues(true));
  }
}
