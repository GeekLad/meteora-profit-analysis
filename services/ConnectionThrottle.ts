import {
  Connection,
  type AccountInfo,
  type Commitment,
  type ConfirmedSignatureInfo,
  type ConfirmedSignaturesForAddress2Options,
  type Finality,
  type GetAccountInfoConfig,
  type GetVersionedTransactionConfig,
  type ParsedAccountData,
  type ParsedTransactionWithMeta,
  type PublicKey,
  type RpcResponseAndContext,
  type TransactionSignature,
} from "@solana/web3.js";
import pThrottle from "p-throttle";

export const CONNECTION_THROTTLE = pThrottle({
  limit: 10,
  interval: 1000,
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
