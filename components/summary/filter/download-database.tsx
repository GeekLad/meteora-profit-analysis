import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { MeteoraDlmmDbTransactions } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import { Dexie } from "dexie";

import { DownloadIcon } from "@/components/icons";

export const DownloadDatabase = (props: {
  hidden?: boolean;
  allTransactions: MeteoraDlmmDbTransactions[];
  done: boolean;
}) => {
  if (props.hidden || props.allTransactions.length == 0) {
    return <></>;
  }

  const db = new Dexie("meteora-dlmm-db");

  db.version(1).stores({
    db: "id",
  });
  const table = db.table("db");

  const onPress = async () => {
    const record = await table.get(1);
    const data = record.data;
    const blob = new Blob([data], { type: "application/octet-stream" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = "meteora-dlmm.db";

    // Append the link to the document body and trigger the download
    document.body.appendChild(link);
    link.click();

    // Clean up by removing the link
    document.body.removeChild(link);
  };

  return (
    <Tooltip
      color="warning"
      content="Note: USD values are not fully loaded in yet, some transactions will be missing USD values."
      isDisabled={props.done}
    >
      <Button
        aria-label="Download CSV"
        className="my-4 md:mr-4"
        color="primary"
        startContent={<DownloadIcon />}
        onPress={() => onPress()}
      >
        SQLite DB 🤓
      </Button>
    </Tooltip>
  );
};
