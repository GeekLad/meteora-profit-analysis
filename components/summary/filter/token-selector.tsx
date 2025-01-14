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
import { useState } from "react";

import {
  TransactionFilter,
  Token,
  applyFilter,
} from "@/components/summary/generate-summary";

export const TokenSelector = (props: {
  hidden: boolean;
  allTransactions: MeteoraDlmmDbTransactions[];
  filter: TransactionFilter;
  selectedItems: Selection;
  baseTokenList: boolean;
  onFilter: (selectedTokens: Selection) => any;
}) => {
  const [displayList, setDiplayList] = useState(false);

  const tokens: Token[] = applyFilter(
    props.allTransactions,
    props.filter,
    false,
  )
    .map((tx) => {
      return {
        mint: props.baseTokenList ? tx.base_mint : tx.quote_mint,
        symbol: props.baseTokenList ? tx.base_symbol : tx.quote_symbol,
        decimals: props.baseTokenList ? tx.base_decimals : tx.quote_decimals,
        logo: props.baseTokenList ? tx.base_logo : tx.quote_logo,
      };
    })
    // Alphabetize
    .sort((a, b) => (a.symbol ? a.symbol.localeCompare(b.symbol) : 1))
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
      <Dropdown
        isOpen={displayList}
        shouldBlockScroll={false}
        onOpenChange={() => {
          setDiplayList((displayList) => !displayList);
        }}
      >
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
            <DropdownItem key="all" textValue="all" onPress={() => all()}>
              Select All
            </DropdownItem>,
            <DropdownItem key="none" textValue="none" onPress={() => clear()}>
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
