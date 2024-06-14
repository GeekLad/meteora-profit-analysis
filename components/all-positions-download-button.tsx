import { Button } from "@nextui-org/react";

import { DownloadIcon } from "./icons";

import {
  MeteoraPositionProfit,
  sortProfitsByRecentGroupTransactions,
} from "@/services/profit-downloader";
import { downloadObjArrayAsCsv } from "@/services/util";

export const AllPositionsDownloadButton = (props: {
  profits: MeteoraPositionProfit[];
}) => {
  if (props.profits.length == 0) {
    return <></>;
  }

  const onClick = () => {
    const sortedProfits = sortProfitsByRecentGroupTransactions(props.profits);
    const profitData = sortedProfits
      .map((profit) => {
        const {
          position,
          pair_name,
          deposits,
          withdraws,
          deposits_usd,
          withdraws_usd,
          average_balance,
          claimed_fees_usd,
          claimed_rewards_usd,
          total_time_days,
          fee_points,
          reward_points,
          balance_points,
          position_profit,
          total_profit,
          errors,
          total_time,
          balance_time_sum_product,
        } = profit;

        const firstDeposit =
          deposits.length == 0
            ? null
            : deposits.sort(
                (a, b) => a.onchain_timestamp - b.onchain_timestamp,
              )[0];

        const lastWithdraw =
          withdraws.length == 0
            ? null
            : withdraws.sort(
                (a, b) => a.onchain_timestamp - b.onchain_timestamp,
              )[0];

        return {
          position_address: position.address,
          pair_address: position.pair_address,
          pair_name: pair_name.name,
          pair_group: pair_name.group_name,
          errors: errors.join(" | "),
          first_deposit_tx_id: firstDeposit ? firstDeposit.tx_id : null,
          first_deposit_onchain_timestamp: firstDeposit
            ? firstDeposit.onchain_timestamp
            : (null as number | string | null),
          last_withdraw_tx_id: lastWithdraw ? lastWithdraw.tx_id : null,
          last_withdraw_onchain_timestamp: lastWithdraw
            ? lastWithdraw.onchain_timestamp
            : (null as number | string | null),
          deposits_usd,
          withdraws_usd,
          average_balance,
          claimed_fees_usd,
          claimed_rewards_usd,
          total_time_days,
          fee_points,
          reward_points,
          balance_points,
          position_profit,
          total_profit,
          total_time,
          balance_time_sum_product,
        };
      })
      .map((data) => {
        data.first_deposit_onchain_timestamp =
          data.first_deposit_onchain_timestamp == null
            ? null
            : new Date(
                Number(data.first_deposit_onchain_timestamp) * 1000,
              ).toISOString();
        data.last_withdraw_onchain_timestamp =
          data.last_withdraw_onchain_timestamp == null
            ? null
            : new Date(
                Number(data.last_withdraw_onchain_timestamp) * 1000,
              ).toISOString();

        return data;
      });

    downloadObjArrayAsCsv("dlmm-all-position-summary.csv", profitData);
  };

  return (
    <Button
      aria-label="Download All Positions"
      className="m-4"
      color="primary"
      startContent={<DownloadIcon />}
      onClick={() => onClick()}
    >
      Download All Positions
    </Button>
  );
};
