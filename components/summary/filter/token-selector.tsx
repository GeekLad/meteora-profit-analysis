import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from "@nextui-org/react";
import { Selection } from "@react-types/shared";

import {
  SummaryData,
  TransactionFilter,
  Token,
} from "@/components/summary/generate-summary";

export const TokenSelector = (props: {
  hidden: boolean;
  data: SummaryData;
  filter: TransactionFilter;
  selectedItems: Selection;
  baseTokenList: boolean;
  onFilter: (selectedTokens: Selection) => any;
}) => {
  const selectedItems = props.selectedItems;
  const tokens = Array.from(props.data.quote.values())
    // Filter quote tokens based on the filter start/end dates
    .filter(
      (quote) =>
        quote.summary.endDate >= props.filter.startDate &&
        quote.summary.startDate <= props.filter.endDate,
    )
    // Get the tokens
    .map((quote) => {
      // Get base tokens
      if (props.baseTokenList) {
        // Filter based on the start/end dates
        const filteredTokens = quote.base.filter(
          (base) =>
            base.summary.endDate >= props.filter.startDate &&
            base.summary.startDate <= props.filter.endDate,
        );

        if (filteredTokens.length == 0) {
          return [] as Token[];
        }

        return filteredTokens.map((base) => base.token);
      }

      return quote.token;
    })
    // If we had base tokens, we'll have an array of arrays of tokens
    .flat()
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
    <div className="m-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-full">
            {props.baseTokenList ? "Base" : "Quote"} Tokens
          </Button>
        </DropdownTrigger>
        <DropdownMenu
          closeOnSelect={false}
          selectedKeys={selectedItems}
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
