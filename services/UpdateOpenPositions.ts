import type { MeteoraPosition } from "./MeteoraPosition";

import { type LbPosition } from "@meteora-ag/dlmm";
import { type Connection } from "@solana/web3.js";

import { getPrices } from "./JupiterPriceApi";
import { getPositionsByUserAndLbPair } from "./ConnectionThrottle";

function updateOpenPositionData(
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

async function updatePositionUsdValues(position: MeteoraPosition) {
  const uniqueMints = [position.mintX, position.mintY];

  const priceMap = await getPrices(uniqueMints);

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
}

export async function updateOpenPosition(
  connection: Connection,
  position: MeteoraPosition,
) {
  const openPositions = await getPositionsByUserAndLbPair(connection, position);

  await Promise.all(
    openPositions.userPositions.map(async (userPosition) => {
      if (userPosition.publicKey.toBase58() == position.position) {
        updateOpenPositionData(
          position,
          userPosition,
          Number(openPositions.activeBin.price),
        );
        await updatePositionUsdValues(position);
        position.updateValues(true);
        position.closeTimestampMs = new Date().getTime();
        position.closeTimestamp =
          new Date().toLocaleDateString() +
          " " +
          new Date().toLocaleTimeString();
      }
    }),
  );
}
