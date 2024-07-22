import {
  type AccountMeta,
  Connection,
  type ParsedAccountData,
  type ParsedInstruction,
  type ParsedTransactionWithMeta,
  type PartiallyDecodedInstruction,
  PublicKey,
} from "@solana/web3.js";
import {
  BorshEventCoder,
  BorshInstructionCoder,
  utils,
  type Instruction,
} from "@coral-xyz/anchor";
import { getPriceOfBinByBinId, IDL as meteoraIdl } from "@meteora-ag/dlmm";

import { type MeteoraDlmmPair } from "./MeteoraDlmmApi";
import { type JupiterTokenListToken } from "./JupiterTokenList";
import { unique } from "./util";
import { getParsedAccountInfo } from "./ConnectionThrottle";

const METEORA_PROGRAM_ID = "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo";
const HAWKSIGHT_PROGRAM_ID = "FqGg2Y1FNxMiGd51Q6UETixQWkF5fB92MysbYogRJb3P";

type MeteoraPositionInstruction =
  | "initializePosition"
  | "addLiquidityByStrategy"
  | "addLiquidityByStrategyOneSide"
  | "addLiquidityByWeight"
  | "addLiquidityOneSide"
  | "claimFee"
  | "claimReward"
  | "removeLiquidityByRange"
  | "removeLiquidity"
  | "RemoveLiquidity"
  | "closePosition";

export type MeteoraPositionAction =
  | "open"
  | "add"
  | "claim"
  | "reward"
  | "remove"
  | "close";

const INSTRUCTION_MAP: Map<MeteoraPositionInstruction, MeteoraPositionAction> =
  new Map([
    ["initializePosition", "open"],
    ["addLiquidityByStrategy", "add"],
    ["addLiquidityByStrategyOneSide", "add"],
    ["addLiquidityByWeight", "add"],
    ["addLiquidityOneSide", "add"],
    ["claimFee", "claim"],
    ["claimReward", "reward"],
    ["removeLiquidityByRange", "remove"],
    ["removeLiquidity", "remove"],
    ["RemoveLiquidity", "remove"],
    ["closePosition", "close"],
  ]);

const METORA_POSITION_INSTRUCTIONS = Array.from(INSTRUCTION_MAP.keys());
const INSTRUCTION_CODER = new BorshInstructionCoder(meteoraIdl);
const EVENT_CODER = new BorshEventCoder(meteoraIdl);

interface MeteoraInstructionInfo {
  timestamp_ms: number;
  slot: number;
  signature: string;
  position: string;
  lbPair: string;
  sender: string;
  type: MeteoraPositionAction;
  tokenTransfers: TokenTransferInfo[];
  activeBinId: null | number;
}

interface TokenTransferInfo {
  mint: string;
  source: string;
  destination: string;
  amount: number;
}

export interface MeteoraPositionTransaction {
  timestamp_ms: number;
  timestamp: string;
  slot: number;
  signature: string;
  position: string;
  lbPair: string;
  sender: string;
  pairName: string;
  open: boolean;
  add: boolean;
  claim: boolean;
  reward: boolean;
  remove: boolean;
  close: boolean;
  mintX: string;
  mintY: string;
  mintXDecimals: number;
  mintYDecimals: number;
  reward1Mint: null | string;
  reward2Mint: null | string;
  symbolX: string;
  symbolY: string;
  symbolReward1: null | string;
  symbolReward2: null | string;
  mintXBalanceChange: number;
  mintYBalanceChange: number;
  mintXOpenBalance: number;
  mintYOpenBalance: number;
  openBalanceValue: number;
  balanceChangeValue: number;
  mintXFeesClaimed: number;
  mintYFeesClaimed: number;
  mintXUnclaimedFees: number;
  mintYUnclaimedFees: number;
  unclaimedFeesValue: number;
  claimedFeesValue: number;
  totalFeesValue: number;
  reward1BalanceChange: number;
  reward2BalanceChange: number;
  reward1UnclaimedBalance: number;
  reward2UnclaimedBalance: number;
  isInverted: boolean;
  isHawksight: boolean;
  activeBinId: null | number;
  price: null | number;
  priceIsEstimated: null | boolean;
  hasApiError: null | boolean;
  usdPrice: null | number;
  usdMintXBalanceChange: null | number;
  usdMintYBalanceChange: null | number;
  usdBalanceChangeValue: null | number;
  usdMintXFeesClaimed: null | number;
  usdMintYFeesClaimed: null | number;
  usdClaimedFeesValue: null | number;
  usdReward1BalanceChange: null | number;
  usdReward2BalanceChange: null | number;
  usdMintXOpenBalance: null | number;
  usdMintYOpenBalance: null | number;
  usdOpenBalanceValue: null | number;
  usdMintXUnclaimedFees: null | number;
  usdMintYUnclaimedFees: null | number;
  usdUnclaimedFeesValue: null | number;
  usdReward1UnclaimedBalance: null | number;
  usdReward2UnclaimedBalance: null | number;
}

function getMeteoraInstructions(tx: ParsedTransactionWithMeta) {
  const outerInstructions = tx.transaction.message.instructions.filter(
    (instruction) => instruction.programId.toBase58() == METEORA_PROGRAM_ID,
  ) as PartiallyDecodedInstruction[];

  if (tx.meta?.innerInstructions) {
    const innerInstructions = tx.meta.innerInstructions
      .map((instruction) => instruction.instructions)
      .flat()
      .filter(
        (instruction) => instruction.programId.toBase58() == METEORA_PROGRAM_ID,
      ) as PartiallyDecodedInstruction[];

    return outerInstructions.concat(innerInstructions);
  }

  return outerInstructions;
}

function isHawksightTransaction(tx: ParsedTransactionWithMeta) {
  return tx.transaction.message.instructions.some(
    (instruction) => instruction.programId.toBase58() == HAWKSIGHT_PROGRAM_ID,
  );
}

function getAccountMetas(
  transaction: ParsedTransactionWithMeta,
  accounts: PublicKey[],
): AccountMeta[] {
  return accounts.map((account) => {
    const {
      pubkey,
      signer: isSigner,
      writable: isWritable,
    } = transaction.transaction.message.accountKeys.find(
      (key) => key.pubkey.toBase58() == account.toBase58(),
    )!;

    return {
      pubkey,
      isSigner,
      isWritable,
    };
  });
}

function getPositionPairAndSender(
  decodedInstruction: Instruction,
  accountMetas: AccountMeta[],
): { position: string; lbPair: string; sender: string } {
  try {
    const { accounts } = INSTRUCTION_CODER.format(
      decodedInstruction,
      accountMetas,
    )!;
    const positionAccount = accounts.find(
      (account) => account.name == "Position",
    )!;
    const position = positionAccount.pubkey.toBase58();
    const lbPairAccount = accounts.find(
      (account) => account.name == "Lb Pair",
    )!;
    const lbPair = lbPairAccount.pubkey.toBase58();
    const senderAccount = accounts.find(
      (account) => account.name == "Sender" || account.name == "Owner",
    )!;
    const sender = senderAccount.pubkey.toBase58();

    return {
      position,
      lbPair,
      sender,
    };
  } catch (err) {
    switch (decodedInstruction.name) {
      case "initializePosition":
        return {
          position: accountMetas[1].pubkey.toBase58(),
          lbPair: accountMetas[2].pubkey.toBase58(),
          sender: accountMetas[3].pubkey.toBase58(),
        };

      case "addLiquidityOneSide":
        return {
          position: accountMetas[0].pubkey.toBase58(),
          lbPair: accountMetas[1].pubkey.toBase58(),
          sender: accountMetas[8].pubkey.toBase58(),
        };

      case "addLiquidityByWeight":
        return {
          position: accountMetas[0].pubkey.toBase58(),
          lbPair: accountMetas[1].pubkey.toBase58(),
          sender: accountMetas[11].pubkey.toBase58(),
        };
    }

    return {
      position: accountMetas[0].pubkey.toBase58(),
      lbPair: accountMetas[1].pubkey.toBase58(),
      sender: accountMetas[11].pubkey.toBase58(),
    };
  }
}

function getActiveBinId(
  eventCoder: BorshEventCoder,
  transaction: ParsedTransactionWithMeta,
  index: number,
) {
  const { instructions } = transaction.meta!.innerInstructions!.find(
    (i) => i.index == index,
  )!;
  const meteoraInstructions = instructions.filter(
    (instruction) => instruction.programId.toBase58() == METEORA_PROGRAM_ID,
  ) as PartiallyDecodedInstruction[];

  const events = meteoraInstructions.map((instruction) => {
    const ixData = utils.bytes.bs58.decode(instruction.data);
    const eventData = utils.bytes.base64.encode(ixData.subarray(8));

    return eventCoder.decode(eventData);
  });

  const eventWithActiveBinId = events.find(
    (event) => event && "activeBinId" in event.data,
  );

  return eventWithActiveBinId
    ? (eventWithActiveBinId.data.activeBinId as number)
    : null;
}

function getTokenTransfers(
  transaction: ParsedTransactionWithMeta,
  index: number,
): TokenTransferInfo[] {
  if (index == -1) {
    return [];
  }

  const instruction = transaction.meta?.innerInstructions?.find(
    (i) => i.index == index,
  );

  if (instruction == undefined) {
    return [];
  }

  const transfers = instruction.instructions.filter(
    (i) =>
      "program" in i &&
      i.program == "spl-token" &&
      "parsed" in i &&
      i.parsed.type == "transferChecked",
  ) as ParsedInstruction[];

  if (transfers.length == 0) {
    return [];
  }

  return transfers.map((transfer) => {
    const { mint, source, destination, tokenAmount } = transfer.parsed.info;

    return {
      mint,
      source,
      destination,
      amount: tokenAmount.uiAmount,
    };
  });
}

function getMeteoraInstructionInfo(
  transaction: ParsedTransactionWithMeta,
  decodedInstruction: Instruction,
  index: number,
  accountMetas: AccountMeta[],
): MeteoraInstructionInfo {
  const tokenTransfers = getTokenTransfers(transaction, index);
  const activeBinId =
    tokenTransfers.length > 0
      ? getActiveBinId(EVENT_CODER, transaction, index)
      : null;
  const { position, lbPair, sender } = getPositionPairAndSender(
    decodedInstruction,
    accountMetas,
  );

  return {
    timestamp_ms: new Date(transaction.blockTime! * 1000).getTime(),
    slot: transaction.slot,
    signature: transaction.transaction.signatures[0],
    position,
    lbPair,
    sender,
    type: INSTRUCTION_MAP.get(
      decodedInstruction.name as MeteoraPositionInstruction,
    )!,
    tokenTransfers,
    activeBinId,
  };
}

function getOuterInstructionIndex(
  transaction: ParsedTransactionWithMeta,
  instruction: PartiallyDecodedInstruction,
) {
  const outerIndex =
    transaction.transaction.message.instructions.indexOf(instruction);

  if (outerIndex != -1) {
    return outerIndex;
  }

  if (transaction.meta?.innerInstructions) {
    const outerInstruction = transaction.meta.innerInstructions.find(
      (innerInstruction) =>
        innerInstruction.instructions.find((i) => i == instruction),
    );

    if (outerInstruction) {
      return outerInstruction.index;
    }

    return -1;
  }

  return -1;
}

function decodeMeteoraInstruction(
  transaction: ParsedTransactionWithMeta,
  instruction: PartiallyDecodedInstruction,
): MeteoraInstructionInfo | undefined {
  const decodedInstruction = INSTRUCTION_CODER.decode(
    instruction.data,
    "base58",
  )!;

  if (
    !decodedInstruction ||
    (decodedInstruction &&
      !METORA_POSITION_INSTRUCTIONS.includes(
        decodedInstruction.name as MeteoraPositionInstruction,
      ))
  ) {
    return undefined;
  }
  const index = getOuterInstructionIndex(transaction, instruction);

  if (index == -1) {
    return undefined;
  }
  const accountMetas = getAccountMetas(transaction, instruction.accounts);

  return getMeteoraInstructionInfo(
    transaction,
    decodedInstruction,
    index,
    accountMetas,
  );
}

function addSyntheticToken(
  mint: string,
  decimals: number,
  tokenMap: Map<string, JupiterTokenListToken>,
) {
  const newToken: JupiterTokenListToken = {
    address: mint,
    chainId: 0,
    decimals,
    name: mint,
    symbol: mint,
    tags: [],
  };

  tokenMap.set(mint, newToken);

  return newToken;
}

async function getSyntheticToken(
  connection: Connection,
  mint: string,
  tokenMap: Map<string, JupiterTokenListToken>,
) {
  const mintAccountInfo = await getParsedAccountInfo(
    connection,
    new PublicKey(mint),
  );
  const mintData = mintAccountInfo.value!.data as ParsedAccountData;
  const decimals = mintData.parsed.info.decimals as number;

  return addSyntheticToken(mint, decimals, tokenMap);
}

async function getMeteoraPositionTransactionsFromInstructions(
  connection: Connection,
  pairs: Map<string, MeteoraDlmmPair>,
  tokenMap: Map<string, JupiterTokenListToken>,
  tx: ParsedTransactionWithMeta,
  instructions: MeteoraInstructionInfo[],
): Promise<MeteoraPositionTransaction[]> {
  const uniquePositions = unique(
    instructions.map((instruction) => instruction.position),
  );

  const transactions = await Promise.all(
    uniquePositions.map(async (position) => {
      const positionIntructions = instructions.filter(
        (instruction) => instruction.position == position,
      );

      const { timestamp_ms, slot, signature, lbPair, sender } =
        positionIntructions[0];

      const timestamp =
        new Date(timestamp_ms).toLocaleDateString() +
        " " +
        new Date(timestamp_ms).toLocaleTimeString();
      const pair = pairs.get(lbPair);

      if (pair) {
        const tokenX =
          tokenMap.get(pair.mint_x) ??
          (await getSyntheticToken(connection, pair.mint_x, tokenMap));
        const tokenY =
          tokenMap.get(pair.mint_y) ??
          (await getSyntheticToken(connection, pair.mint_y, tokenMap));
        const pairName = pair.name;
        const mintX = pair.mint_x;
        const mintY = pair.mint_y;
        const mintXDecimals = tokenX.decimals;
        const mintYDecimals = tokenY.decimals;
        const reward1Mint =
          pair.reward_mint_x == "11111111111111111111111111111111"
            ? null
            : pair.reward_mint_x;
        const reward2Mint =
          pair.reward_mint_y == "11111111111111111111111111111111"
            ? null
            : pair.reward_mint_y;
        const symbolX = tokenX?.symbol ?? mintX;
        const symbolY = tokenY?.symbol ?? mintY;
        const symbolReward1 =
          reward1Mint == null
            ? null
            : tokenMap.get(pair.reward_mint_x)?.symbol ?? pair.reward_mint_x;
        const symbolReward2 =
          reward2Mint == null
            ? null
            : tokenMap.get(pair.reward_mint_y)?.symbol ?? pair.reward_mint_y;

        const transaction: MeteoraPositionTransaction = {
          timestamp_ms,
          timestamp,
          slot,
          signature,
          position,
          lbPair,
          sender,
          pairName,
          open: false,
          add: false,
          claim: false,
          reward: false,
          remove: false,
          close: false,
          mintX,
          mintY,
          mintXDecimals,
          mintYDecimals,
          reward1Mint,
          reward2Mint,
          symbolX,
          symbolY,
          symbolReward1,
          symbolReward2,
          mintXBalanceChange: 0,
          mintYBalanceChange: 0,
          mintXOpenBalance: 0,
          mintYOpenBalance: 0,
          openBalanceValue: 0,
          balanceChangeValue: 0,
          mintXFeesClaimed: 0,
          mintYFeesClaimed: 0,
          mintXUnclaimedFees: 0,
          mintYUnclaimedFees: 0,
          unclaimedFeesValue: 0,
          claimedFeesValue: 0,
          totalFeesValue: 0,
          reward1BalanceChange: 0,
          reward2BalanceChange: 0,
          reward1UnclaimedBalance: 0,
          reward2UnclaimedBalance: 0,
          isInverted: false,
          isHawksight: isHawksightTransaction(tx),
          activeBinId: null,
          price: null,
          priceIsEstimated: null,
          hasApiError: null,
          usdPrice: null,
          usdMintXBalanceChange: null,
          usdMintYBalanceChange: null,
          usdBalanceChangeValue: null,
          usdMintXOpenBalance: null,
          usdMintYOpenBalance: null,
          usdOpenBalanceValue: null,
          usdMintXUnclaimedFees: null,
          usdMintYUnclaimedFees: null,
          usdUnclaimedFeesValue: null,
          usdMintXFeesClaimed: null,
          usdMintYFeesClaimed: null,
          usdClaimedFeesValue: null,
          usdReward1BalanceChange: null,
          usdReward2BalanceChange: null,
          usdReward1UnclaimedBalance: null,
          usdReward2UnclaimedBalance: null,
        };

        positionIntructions.forEach((instruction) => {
          transaction.activeBinId =
            transaction.activeBinId ?? instruction.activeBinId;
          const instructionType = instruction.type;

          switch (instructionType) {
            case "add":
              instruction.tokenTransfers.forEach((transfer) => {
                transaction.mintXBalanceChange +=
                  transfer.mint == mintX ? -transfer.amount : 0;
                transaction.mintYBalanceChange +=
                  transfer.mint == mintY ? -transfer.amount : 0;
              });
              break;

            case "remove":
              instruction.tokenTransfers.forEach((transfer) => {
                transaction.mintXBalanceChange +=
                  transfer.mint == mintX ? transfer.amount : 0;
                transaction.mintYBalanceChange +=
                  transfer.mint == mintY ? transfer.amount : 0;
              });
              break;

            case "claim":
              instruction.tokenTransfers.forEach((transfer) => {
                transaction.mintXFeesClaimed +=
                  transfer.mint == mintX ? transfer.amount : 0;
                transaction.mintYFeesClaimed +=
                  transfer.mint == mintY ? transfer.amount : 0;
              });
              break;

            case "reward":
              instruction.tokenTransfers.forEach((transfer) => {
                transaction.reward1BalanceChange +=
                  transfer.mint == reward1Mint ? transfer.amount : 0;
                transaction.reward2BalanceChange +=
                  transfer.mint == reward2Mint ? transfer.amount : 0;
              });
              break;
          }

          transaction.open = transaction.open || instructionType == "open";
          transaction.add = transaction.add || instructionType == "add";
          transaction.claim = transaction.claim || instructionType == "claim";
          transaction.reward =
            transaction.reward || instructionType == "reward";
          transaction.remove =
            transaction.remove || instructionType == "remove";
          transaction.close = transaction.close || instructionType == "close";
        });
        if (transaction.activeBinId !== null) {
          transaction.price =
            getPriceOfBinByBinId(
              transaction.activeBinId,
              pair.bin_step,
            ).toNumber() *
            10 ** (mintXDecimals - mintYDecimals);
          transaction.balanceChangeValue =
            transaction.price * transaction.mintXBalanceChange +
            transaction.mintYBalanceChange;
          transaction.balanceChangeValue =
            Math.floor(transaction.balanceChangeValue * 10 ** mintYDecimals) /
            10 ** mintYDecimals;
          transaction.claimedFeesValue =
            transaction.price * transaction.mintXFeesClaimed +
            transaction.mintYFeesClaimed;
          transaction.claimedFeesValue =
            Math.floor(transaction.claimedFeesValue * 10 ** mintYDecimals) /
            10 ** mintYDecimals;
          transaction.priceIsEstimated = false;
        }

        return transaction;
      }

      return undefined;
    }),
  );

  return transactions.filter(
    (transaction) => transaction,
  ) as MeteoraPositionTransaction[];
}

export async function parseMeteoraTransactions(
  connection: Connection,
  pairs: Map<string, MeteoraDlmmPair>,
  tokenList: Map<string, JupiterTokenListToken>,
  transaction: ParsedTransactionWithMeta,
): Promise<MeteoraPositionTransaction[]> {
  const meteoraInstructions = getMeteoraInstructions(transaction);

  if (meteoraInstructions.length > 0) {
    const decodedInstructions = meteoraInstructions
      .map((instruction) => decodeMeteoraInstruction(transaction, instruction))
      .filter(
        (decodedInstruction) => decodedInstruction != undefined,
      ) as MeteoraInstructionInfo[];

    if (decodedInstructions.length > 0) {
      return getMeteoraPositionTransactionsFromInstructions(
        connection,
        pairs,
        tokenList,
        transaction,
        decodedInstructions,
      );
    }
  }

  return [];
}
