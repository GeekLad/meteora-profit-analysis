import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@nextui-org/react";

import { MeteoraPosition } from "@/services/MeteoraPosition";

export type HawksightSelectorItem =
  | "allpositions"
  | "nohawksight"
  | "hawksightonly";

export const HawksightSelector = (props: {
  hidden?: boolean;
  positions: MeteoraPosition[];
  selectedItem?: HawksightSelectorItem;
  onFilter: (selection: HawksightSelectorItem) => any;
}) => {
  const selectedItem = props.selectedItem
    ? props.selectedItem
    : ("allpositions" as HawksightSelectorItem);
  const hawksightPositions = props.positions.filter(
    (position) => position.isHawksight,
  );

  if (props.hidden) {
    return <></>;
  }

  if (hawksightPositions.length == 0) {
    return <div>&nbsp;</div>;
  }

  function update(selection: Set<HawksightSelectorItem>) {
    props.onFilter(Array.from(selection.entries())[0][0]);
  }

  return (
    <div className="m-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-full">Hawksight</Button>
        </DropdownTrigger>
        <DropdownMenu
          selectedKeys={[selectedItem]}
          selectionMode="single"
          onSelectionChange={(selection) =>
            update(selection as Set<HawksightSelectorItem>)
          }
        >
          <DropdownItem
            key="allpositions"
            textValue="allpositions"
            value="allpositions"
          >
            All Transactions
          </DropdownItem>
          <DropdownItem
            key="nohawksight"
            textValue="nohawksight"
            value="nohawksight"
          >
            Exclude Hawksight
          </DropdownItem>
          <DropdownItem
            key="hawksightonly"
            textValue="hawksightonly"
            value="hawksightonly"
          >
            Hawksight Only
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
