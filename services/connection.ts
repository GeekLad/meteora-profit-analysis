import pThrottle from "p-throttle";
import DLMM, { LbPosition } from "@meteora-ag/dlmm";
import {
  AccountInfo,
  ConfirmedSignatureInfo,
  Connection,
  ParsedAccountData,
  ParsedTransactionWithMeta,
  PublicKey,
  RpcResponseAndContext,
} from "@solana/web3.js";
import { type Idl } from "@project-serum/anchor";
import { IDL } from "@meteora-ag/dlmm";
import { SolanaParser } from "@debridge-finance/solana-transaction-parser";

import { METEORA_PROGRAM_ID, RPC_MAX_TPS } from "./config";
import { exponentialRetryDelay, throttledCachedRequest } from "./util";

const THROTTLE_RPC = pThrottle({
  limit: Number(RPC_MAX_TPS),
  interval: 1000,
  strict: true,
});

export const getDlmm: (
  connection: Connection,
  poolAddress: string,
) => Promise<DLMM> = throttledCachedRequest(
  (connection: Connection, poolAddress: string) => {
    return exponentialRetryDelay(() =>
      DLMM.create(connection, new PublicKey(poolAddress)),
    );
  },
  THROTTLE_RPC,
);

export const getDlmmAndUserPositions = throttledCachedRequest(
  async (
    connection: Connection,
    poolAddress: string,
    owner: string,
  ): Promise<{
    dlmmPool: DLMM;
    userPositions: LbPosition[];
  }> => {
    const dlmmPool = await getDlmm(connection, poolAddress);

    const { userPositions } = await dlmmPool.getPositionsByUserAndLbPair(
      new PublicKey(owner),
    );

    return { dlmmPool, userPositions };
  },
  THROTTLE_RPC,
);

const getSignaturesForAddress = THROTTLE_RPC(
  async (connection: Connection, pubKey: PublicKey, before?: string) => {
    return exponentialRetryDelay(() =>
      connection.getSignaturesForAddress(pubKey, { before }),
    );
  },
);

export async function getAllSignaturesForAddress(
  connection: Connection,
  address: string,
  onSignaturesFound?: (signatures: ConfirmedSignatureInfo[]) => any,
  onDone?: () => any,
): Promise<ConfirmedSignatureInfo[]> {
  try {
    const pubKey = new PublicKey(address);
    let before: string | undefined = undefined;
    let newSignatures: ConfirmedSignatureInfo[] = [];
    const allSignatures: ConfirmedSignatureInfo[] = [];

    do {
      before =
        newSignatures.length > 0
          ? newSignatures[newSignatures.length - 1].signature
          : undefined;
      newSignatures = await getSignaturesForAddress(connection, pubKey, before);
      allSignatures.push(...newSignatures);

      if (onSignaturesFound) {
        onSignaturesFound(newSignatures);
      }
    } while (newSignatures.length != 0);
    if (onDone) {
      onDone();
    }

    return allSignatures;
  } catch (err) {
    if (onDone) {
      onDone();
    }

    return [];
  }
}

export const getParsedTransactions: (
  connection: Connection,
  signatures: string[],
  ms?: number,
) => Promise<(ParsedTransactionWithMeta | null)[]> = THROTTLE_RPC(
  async (connection: Connection, signatures: string[]) => {
    return exponentialRetryDelay(() =>
      connection.getParsedTransactions(signatures, {
        maxSupportedTransactionVersion: 0,
        commitment: "confirmed",
      }),
    );
  },
);

export const getParsedAccountInfo: (
  connection: Connection,
  address: string,
) => Promise<
  RpcResponseAndContext<AccountInfo<Buffer | ParsedAccountData> | null>
> = THROTTLE_RPC(async (connection: Connection, address: string) => {
  return exponentialRetryDelay(() => {
    return connection.getParsedAccountInfo(new PublicKey(address));
  });
});

export const getPositionAddressesFromSignature = THROTTLE_RPC(
  async (connection: Connection, txSignature: string): Promise<string[]> => {
    const parser = new SolanaParser([
      {
        idl: IDL as Idl,
        programId: METEORA_PROGRAM_ID,
      },
    ]);

    try {
      const tx = await parser.parseTransaction(connection, txSignature, false);

      if (tx == undefined) {
        return [];
      }
      const accounts = tx.map((data) => data.accounts).flat();
      const positions = accounts.filter(
        (account) => account.name == "position",
      );

      if (!positions) {
        return [];
      }

      const postiionAddresses = positions.map((position) =>
        position.pubkey.toBase58(),
      );

      return Array.from(new Set(postiionAddresses));
    } catch (err) {
      return [];
    }
  },
);
