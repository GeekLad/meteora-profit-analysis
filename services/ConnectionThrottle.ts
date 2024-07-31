import {
  Connection,
  PublicKey,
  type AccountInfo,
  type Commitment,
  type ConfirmedSignatureInfo,
  type ConfirmedSignaturesForAddress2Options,
  type Finality,
  type GetAccountInfoConfig,
  type GetVersionedTransactionConfig,
  type ParsedAccountData,
  type ParsedTransactionWithMeta,
  type RpcResponseAndContext,
  type TransactionSignature,
} from "@solana/web3.js";
import pThrottle from "p-throttle";
import DLMM from "@meteora-ag/dlmm";

import { throttledCachedRequest } from "./util";
import { MeteoraPosition } from "./MeteoraPosition";

export const CONNECTION_THROTTLE = pThrottle({
  limit: 1,
  interval: 100,
  strict: true,
});

export const getParsedTransactions = CONNECTION_THROTTLE(
  async (
    connection: Connection,
    signatures: TransactionSignature[],
    commitmentOrConfig?: GetVersionedTransactionConfig | Finality,
  ): Promise<(ParsedTransactionWithMeta | null)[]> => {
    return connection.getParsedTransactions(signatures, commitmentOrConfig);
  },
);

export const getParsedAccountInfo = CONNECTION_THROTTLE(
  async (
    connection: Connection,
    publicKey: PublicKey,
    commitmentOrConfig?: Commitment | GetAccountInfoConfig,
  ): Promise<
    RpcResponseAndContext<AccountInfo<Buffer | ParsedAccountData> | null>
  > => {
    return connection.getParsedAccountInfo(publicKey, commitmentOrConfig);
  },
);

export const getConfirmedSignaturesForAddress2 = CONNECTION_THROTTLE(
  async (
    connection: Connection,
    address: PublicKey,
    options?: ConfirmedSignaturesForAddress2Options,
    commitment?: Finality,
  ): Promise<Array<ConfirmedSignatureInfo>> => {
    return connection.getConfirmedSignaturesForAddress2(
      address,
      options,
      commitment,
    );
  },
);

export const createDlmm = throttledCachedRequest(
  async (connection: Connection, pairAddress: string) => {
    return DLMM.create(connection, new PublicKey(pairAddress));
  },
  CONNECTION_THROTTLE,
);

export const getPositionsByUserAndLbPair = CONNECTION_THROTTLE(
  async (connection: Connection, position: MeteoraPosition) => {
    const pool = await createDlmm(connection, position.lbPair);

    return pool.getPositionsByUserAndLbPair(new PublicKey(position.sender));
  },
);
