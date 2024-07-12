import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";

import { MeteoraPosition } from "@/services/MeteoraPosition";

export type OpenPositionSelectorItem = "allpositions" | "open" | "closed";

export const OpenPositionSelector = (props: {
  hidden?: boolean;
  positions: MeteoraPosition[];
  selectedItem?: OpenPositionSelectorItem;
  onFilter: (selection: OpenPositionSelectorItem) => any;
}) => {
  const selectedItem = props.selectedItem
    ? props.selectedItem
    : ("allpositions" as OpenPositionSelectorItem);

  if (props.hidden) {
    return <></>;
  }

  function update(selection: Set<OpenPositionSelectorItem>) {
    props.onFilter(Array.from(selection.entries())[0][0]);
  }

  return (
    <div className="m-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-full">Position Status</Button>
        </DropdownTrigger>
        <DropdownMenu
          selectedKeys={[selectedItem]}
          selectionMode="single"
          onSelectionChange={(selection) =>
            update(selection as Set<OpenPositionSelectorItem>)
          }
        >
          <DropdownItem
            key="allpositions"
            textValue="allpositions"
            value="allpositions"
          >
            All Transactions
          </DropdownItem>
          <DropdownItem key="closed" textValue="closed" value="closed">
            Only Closed Positions
          </DropdownItem>
          <DropdownItem key="open" textValue="open" value="open">
            Only Open Positions
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
