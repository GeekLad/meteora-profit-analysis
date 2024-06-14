import {
  SortDescriptor,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@nextui-org/react";
import { useState } from "react";

import { PositionLoadingState } from "@/pages";
import { MeteoraPairGroup } from "@/services/profit-downloader";

interface DataColumns {
  name: {
    group_name: string;
    group_id: string;
  };
  pair_count: number;
  position_count: number;
  claimed_fees_usd: number;
  claimed_rewards_usd: number;
  deposits_usd: number;
  withdraws_usd: number;
  total_profit: number;
  average_balance: number;
}

function formatTotalRow(config: {
  pairGroup: MeteoraPairGroup | DataColumns;
  additional?: string;
  firstLast?: "first" | "last";
}) {
  return (
    (config.additional ? config.additional + " " : "") +
    (config.pairGroup.name.group_name != "Total"
      ? ""
      : !config.firstLast
        ? "font-bold text-lg bg-slate-500 text-white"
        : config.firstLast == "first"
          ? "font-bold text-lg bg-slate-500 text-white rounded-l-lg"
          : "font-bold text-lg bg-slate-500 text-white rounded-r-lg")
  );
}

export const UserPositionList = (props: {
  positionLoadingState: PositionLoadingState;
}) => {
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "total_profit",
    direction: "descending",
  } as SortDescriptor);

  if (props.positionLoadingState.userProfit.pair_groups.length == 0) {
    return <></>;
  }

  const totalData = {
    name: {
      group_name: "Total",
      group_id: "Total",
    },
    pair_count: props.positionLoadingState.userProfit.pair_count,
    position_count: props.positionLoadingState.userProfit.position_count,
    deposits_usd: props.positionLoadingState.userProfit.deposits_usd,
    withdraws_usd: props.positionLoadingState.userProfit.withdraws_usd,
    claimed_fees_usd: props.positionLoadingState.userProfit.claimed_fees_usd,
    claimed_rewards_usd:
      props.positionLoadingState.userProfit.claimed_rewards_usd,
    average_balance:
      props.positionLoadingState.userProfit.total_time == 0
        ? 0
        : props.positionLoadingState.userProfit.balance_time_sum_product /
          props.positionLoadingState.userProfit.total_time,
    total_profit: props.positionLoadingState.userProfit.total_profit,
  };

  function sortGroups(sortDescriptor: SortDescriptor) {
    const data = props.positionLoadingState.userProfit.pair_groups.sort(
      (a, b) => {
        switch (sortDescriptor.column) {
          case "fees_rewards":
            return sortDescriptor.direction == "descending"
              ? b.claimed_fees_usd +
                  b.claimed_rewards_usd -
                  a.claimed_fees_usd -
                  a.claimed_rewards_usd
              : a.claimed_fees_usd +
                  a.claimed_rewards_usd -
                  b.claimed_fees_usd -
                  b.claimed_rewards_usd;

          case "avg_balance_profit_percent":
            const a_percent =
              a.average_balance == 0 ? 0 : a.total_profit / a.average_balance;
            const b_percent =
              b.average_balance == 0 ? 0 : b.total_profit / b.average_balance;

            return sortDescriptor.direction == "descending"
              ? b_percent - a_percent
              : a_percent - b_percent;

          case "deposits_profit_percent":
            const a_dpercent =
              a.deposits_usd == 0 ? 0 : a.total_profit / a.deposits_usd;
            const b_dpercent =
              b.deposits_usd == 0 ? 0 : b.total_profit / b.deposits_usd;

            return sortDescriptor.direction == "descending"
              ? b_dpercent - a_dpercent
              : a_dpercent - b_dpercent;

          case "position_count":
          case "total_profit":
          case "average_balance":
          case "deposits_usd":
          case "withdraws_usd":
            return sortDescriptor.direction == "descending"
              ? b[sortDescriptor.column] - a[sortDescriptor.column]
              : a[sortDescriptor.column] - b[sortDescriptor.column];

          case "name":
            return sortDescriptor.direction == "ascending"
              ? a.name.group_name.localeCompare(b.name.group_name)
              : b.name.group_name.localeCompare(a.name.group_name);

          default:
            return 0;
        }
      },
    ) as (MeteoraPairGroup | DataColumns)[];

    return data;
  }

  return (
    <div className="w-full pl-4 pr-4">
      <Table
        sortDescriptor={sortDescriptor}
        onSortChange={(descriptor) => setSortDescriptor(descriptor)}
      >
        <TableHeader>
          <TableColumn key="name" allowsSorting>
            Pair
          </TableColumn>
          <TableColumn
            key="pair_count"
            allowsSorting
            className="hidden lg:table-cell"
          >
            # of <br />
            Markets
          </TableColumn>
          <TableColumn
            key="position_count"
            allowsSorting
            className="hidden lg:table-cell"
          >
            # of <br />
            Positions
          </TableColumn>
          <TableColumn key="fees_rewards" allowsSorting>
            Fees & <br />
            Rewards
          </TableColumn>
          <TableColumn
            key="deposits_usd"
            allowsSorting
            className="hidden lg:table-cell"
          >
            Total <br />
            Deposits
          </TableColumn>
          <TableColumn
            key="withdraws_usd"
            allowsSorting
            className="hidden lg:table-cell"
          >
            Total <br />
            Withdrawals
          </TableColumn>
          <TableColumn
            key="total_profit"
            allowsSorting
            className="rounded-r-lg lg:rounded-r-none"
          >
            Total <br />
            Profit
          </TableColumn>
          <TableColumn
            key="average_balance"
            allowsSorting
            className="hidden lg:table-cell"
          >
            Average <br />
            Balance
          </TableColumn>
          <TableColumn
            key="avg_balance_profit_percent"
            allowsSorting
            className="hidden lg:table-cell"
          >
            Average Balance <br />
            Profit %
          </TableColumn>
          <TableColumn
            key="deposits_profit_percent"
            allowsSorting
            className="hidden lg:table-cell"
          >
            Deposits <br />
            Profit %
          </TableColumn>
        </TableHeader>
        <TableBody items={[...sortGroups(sortDescriptor), totalData]}>
          {(pairGroup) => (
            <TableRow key={pairGroup.name.group_id}>
              <TableCell
                className={formatTotalRow({ pairGroup, firstLast: "first" })}
              >
                {pairGroup.name.group_name}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {pairGroup.pair_count.toLocaleString("en-US")}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {pairGroup.position_count.toLocaleString("en-US")}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "text-right",
                  pairGroup,
                })}
              >
                {(
                  pairGroup.claimed_fees_usd + pairGroup.claimed_rewards_usd
                ).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {pairGroup.deposits_usd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {pairGroup.withdraws_usd.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "rounded-r-lg lg:rounded-r-none text-right",
                  pairGroup,
                })}
              >
                {pairGroup.total_profit.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {pairGroup.average_balance.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                })}
              >
                {(pairGroup.average_balance == 0
                  ? 0
                  : pairGroup.total_profit / pairGroup.average_balance
                ).toLocaleString("en-US", {
                  style: "percent",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
              <TableCell
                className={formatTotalRow({
                  additional: "hidden lg:table-cell text-right",
                  pairGroup,
                  firstLast: "last",
                })}
              >
                {(pairGroup.deposits_usd == 0
                  ? 0
                  : pairGroup.total_profit / pairGroup.deposits_usd
                ).toLocaleString("en-US", {
                  style: "percent",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
