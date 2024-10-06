import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";

import { HawksightStatus } from "@/components/summary/generate-summary";

export const HawksightDropdown = (props: {
  hidden?: boolean;
  allTransactions: MeteoraDlmmDbTransactions[];
  status: HawksightStatus;
  onFilter: (selectedStatus: HawksightStatus) => any;
}) => {
  if (props.hidden) {
    return <></>;
  }

  if (!props.allTransactions.some((tx) => tx.is_hawksight)) {
    return <></>;
  }

  return (
    <div className="my-4 mr-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-2/3">Hawksight</Button>
        </DropdownTrigger>
        <DropdownMenu
          closeOnSelect={false}
          selectedKeys={[props.status]}
          selectionMode="single"
          onSelectionChange={(keys) =>
            props.onFilter(Array.from(keys)[0] as HawksightStatus)
          }
        >
          <DropdownItem key="include" textValue="include">
            Include
          </DropdownItem>
          <DropdownItem key="exclude" textValue="exclude">
            Exclude
          </DropdownItem>
          <DropdownItem key="hawksightOnly" textValue="hawksightOnly">
            Hawksight Only
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
