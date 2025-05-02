"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
import { Listbox, ListboxItem } from "@heroui/listbox";
import Image from "next/image";
import { Selection } from "@react-types/shared";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import { useEffect, useState } from "react";

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
  showTextFilter: boolean;
}) => {
  const [displayList, setDiplayList] = useState(false);
  const [textFilter, setTextFilter] = useState("");

  const tokens: Token[] = applyFilter(
    props.allTransactions,
    props.filter,
    false
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
    // Remove dupes and apply text filter when set
    .filter((token, index, array) => {
      const notDupe =
        array.indexOf(array.find((t) => t.mint == token.mint)!) == index;

      if (textFilter) {
        const matchesMint = token.mint === textFilter;
        const matchesSymbol = token.symbol
          .toLowerCase()
          .includes(textFilter.toLowerCase());

        return notDupe && (matchesMint || matchesSymbol);
      }

      return notDupe;
    });

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
    <div className="my-4 md:mr-4">
      <Popover
        isOpen={displayList}
        placement="bottom"
        shouldBlockScroll={false}
        shouldCloseOnScroll={false}
        onOpenChange={() => {
          setDiplayList((displayList) => !displayList);
          setTextFilter("");
        }}
      >
        <PopoverTrigger>
          <Button className="w-full">
            {props.baseTokenList ? "Base" : "Quote"} Tokens
          </Button>
        </PopoverTrigger>
        <PopoverContent className="min-w-[200px] max-h-[350px] px-1">
          {props.showTextFilter && (
            <div className="p-1">
              <Input
                aria-label="name-or-ca-input"
                placeholder="Enter name or CA"
                type="text"
                value={textFilter}
                onValueChange={setTextFilter}
              />
            </div>
          )}
          <Listbox
            aria-label="Listbox menu with sections"
            className="overflow-auto"
            label="listbox-a"
            selectedKeys={props.selectedItems}
            selectionMode="multiple"
            onSelectionChange={(keys) => updateTokens(keys)}
          >
            {[
              <ListboxItem
                key="all"
                hideSelectedIcon={true}
                textValue="all"
                onPress={() => all()}
              >
                Select All
              </ListboxItem>,
              <ListboxItem
                key="none"
                hideSelectedIcon={true}
                textValue="none"
                onPress={() => clear()}
              >
                Select None
              </ListboxItem>,
            ].concat(
              tokens.map((token) => {
                return (
                  <ListboxItem
                    key={token.mint}
                    startContent={
                      <Image
                        alt="start"
                        height="20"
                        src={token.logo}
                        width="20"
                      />
                    }
                    textValue={token.mint}
                    value={token.mint}
                  >
                    {token.symbol}
                  </ListboxItem>
                );
              })
            )}
          </Listbox>
        </PopoverContent>
      </Popover>
    </div>
  );
};
