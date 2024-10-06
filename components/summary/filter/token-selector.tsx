import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from "@nextui-org/react";
import { Selection } from "@react-types/shared";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

import {
  TransactionFilter,
  Token,
} from "@/components/summary/generate-summary";

export const TokenSelector = (props: {
  hidden: boolean;
  allTransactions: MeteoraDlmmDbTransactions[];
  filter: TransactionFilter;
  selectedItems: Selection;
  baseTokenList: boolean;
  onFilter: (selectedTokens: Selection) => any;
}) => {
  const tokens: Token[] = props.allTransactions
    // Filter transactions first
    .filter((tx) => {
      const txDate = new Date(tx.block_time * 1000);

      if (txDate < props.filter.startDate) {
        return false;
      }

      if (txDate > props.filter.endDate) {
        return false;
      }

      if (props.filter.positionStatus == "closed" && tx.position_is_open) {
        return false;
      }

      if (props.filter.positionStatus == "open" && !tx.position_is_open) {
        return false;
      }

      if (props.filter.hawksight == "exclude" && tx.is_hawksight) {
        return false;
      }

      if (props.filter.hawksight == "hawksightOnly" && !tx.is_hawksight) {
        return false;
      }

      return true;
    })
    .map((tx) => {
      return {
        mint: props.baseTokenList ? tx.base_mint : tx.quote_mint,
        symbol: props.baseTokenList ? tx.base_symbol : tx.quote_symbol,
        decimals: props.baseTokenList ? tx.base_decimals : tx.quote_decimals,
        logo: props.baseTokenList ? tx.base_logo : tx.quote_logo,
      };
    })
    // Alphabetize
    .sort((a, b) => a.symbol.localeCompare(b.symbol))
    // Remove dupes
    .filter(
      (token, index, array) =>
        array.indexOf(array.find((t) => t.mint == token.mint)!) == index,
    );

  if (props.hidden) {
    return <></>;
  }

  function all() {
    props.onFilter(new Set(tokens.map((token) => token.mint)));
  }

  function clear() {
    props.onFilter(new Set());
  }

  function updateTokens(keys: Selection) {
    props.onFilter(keys);
  }

  return (
    <div className="my-4 mr-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-2/3">
            {props.baseTokenList ? "Base" : "Quote"} Tokens
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          closeOnSelect={false}
          selectedKeys={props.selectedItems}
          selectionMode="multiple"
          onSelectionChange={(keys) => updateTokens(keys)}
        >
          {[
            <DropdownItem key="all" textValue="all" onClick={() => all()}>
              Select All
            </DropdownItem>,
            <DropdownItem key="none" textValue="none" onClick={() => clear()}>
              Select None
            </DropdownItem>,
          ].concat(
            tokens.map((token) => {
              return (
                <DropdownItem
                  key={token.mint}
                  startContent={<Image src={token.logo} width="20" />}
                  textValue={token.mint}
                  value={token.mint}
                >
                  {token.symbol}
                </DropdownItem>
              );
            }),
          )}
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
