import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

import { DownloadIcon } from "@/components/icons";
import { downloadObjArrayAsCsv } from "@/services/util";
import {
  applyFilter,
  TransactionFilter,
} from "@/components/summary/generate-summary";

export const DownloadCsvButton = (props: {
  hidden?: boolean;
  allTransactions: MeteoraDlmmDbTransactions[];
  done: boolean;
  filter: TransactionFilter;
}) => {
  if (props.hidden || props.allTransactions.length == 0) {
    return <></>;
  }

  const onPress = () => {
    downloadObjArrayAsCsv(
      "transactions.csv",
      applyFilter(
        props.allTransactions.map((tx) => {
          const date_time =
            new Date(tx.block_time * 1000).toLocaleDateString() +
            " " +
            new Date(tx.block_time * 1000).toLocaleTimeString();

          return { ...tx, date_time };
        }),
        props.filter
      ),
      [
        "block_time",
        "date_time",
        "signature",
        "position_address",
        "owner_address",
        "pair_address",
        "is_hawksight",
        "is_opening_transaction",
        "is_closing_transaction",
        "position_is_open",
        "base_symbol",
        "quote_symbol",
        "price",
        "fee_amount",
        "deposit",
        "withdrawal",
        "position_balance",
        "usd_fee_amount",
        "usd_deposit",
        "usd_withdrawal",
        "usd_position_balance",
        "usd_impermanent_loss",
        "usd_pnl",
        "impermanent_loss",
        "pnl",
      ]
    );
  };

  return (
    <Tooltip
      color="warning"
      content="Note: USD values are not fully loaded in yet, some transactions will be missing USD values."
      isDisabled={props.done}
    >
      <Button
        aria-label="Download CSV"
        className="my-4 md:mr-4"
        color="primary"
        startContent={<DownloadIcon />}
        onPress={() => onPress()}
      >
        Download CSV
      </Button>
    </Tooltip>
  );
};
