import {
  Dropdown,
  DropdownTrigger,
  Button,
  DropdownMenu,
  DropdownItem,
} from "@nextui-org/react";

import { PositionStatus } from "@/components/summary/generate-summary";

export const PositionStatusDropdown = (props: {
  hidden?: boolean;
  status: PositionStatus;
  onFilter: (selectedStatus: PositionStatus) => any;
}) => {
  if (props.hidden) {
    return <></>;
  }

  return (
    <div className="my-4 mr-4">
      <Dropdown shouldBlockScroll={false}>
        <DropdownTrigger>
          <Button className="lg:w-2/3">Status</Button>
        </DropdownTrigger>
        <DropdownMenu
          closeOnSelect={false}
          selectedKeys={[props.status]}
          selectionMode="single"
          onSelectionChange={(keys) =>
            props.onFilter(Array.from(keys)[0] as PositionStatus)
          }
        >
          <DropdownItem key="all" textValue="all">
            All Positions
          </DropdownItem>
          <DropdownItem key="open" textValue="open">
            Open Positions Only
          </DropdownItem>
          <DropdownItem key="closed" textValue="closed">
            Closed Positions Only
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
};
