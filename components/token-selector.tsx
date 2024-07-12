import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Image,
} from "@nextui-org/react";
import { Selection } from "@react-types/shared";

import { MeteoraPosition } from "@/services/MeteoraPosition";
import { JupiterTokenListToken } from "@/services/JupiterTokenList";
import { unique } from "@/services/util";

export const TokenSelector = (props: {
  hidden?: boolean;
  baseTokenList?: boolean;
  positions: MeteoraPosition[];
  tokenMap: Map<string, JupiterTokenListToken>;
  selectedItems?: Selection;
  onFilter: (selectedTokens: Selection) => any;
}) => {
  const selectedItems = props.selectedItems ?? "all";

  if (props.hidden) {
    return <></>;
  }

  const positionTokenAddresses = unique(
    props.positions.map((position) =>
      props.baseTokenList ? position.mintX : position.mintY,
    ),
  );
  const tokens = Array.from(props.tokenMap.values())
    .filter((token) => positionTokenAddresses.includes(token.address))
    .sort((a, b) => a.symbol.localeCompare(b.symbol));

  function all() {
    props.onFilter("all");
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
                  key={token.address}
                  startContent={<Image src={token.logoURI} width="20" />}
                  textValue={token.address}
                  value={token.address}
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
