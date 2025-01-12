import MeteoraDlmmDb, {
  MeteoraDlmmDbTransactions,
} from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import initSqlJs, { type Database } from "sql.js";
import Dexie, { Table } from "dexie";
import { delay } from "@/services/util";

declare var self: Worker;

let db: Dexie;
let table: Table;
let sql: initSqlJs.SqlJsStatic;

async function init() {
  if (!db) {
    db = new Dexie("meteora-dlmm-db");
    db.version(1).stores({
      db: "id",
    });
    table = db.table("db");
    sql = await initSqlJs({
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/${file}`,
    });
  }
}

export interface DataWorkerMessage {
  transactions: MeteoraDlmmDbTransactions[];
}

async function readData(walletAddress: string) {
  await init();
  const record = await table.get(1);
  const transactions: MeteoraDlmmDbTransactions[] = [];
  if (record?.data) {
    const db = new sql.Database(record?.data);
    const statement = db.prepare(`
      SELECT * FROM v_transactions where owner_address = '${
        walletAddress
      }' and position_is_open = 0
    `);
    while (statement.step())
      transactions.push(statement.getAsObject() as MeteoraDlmmDbTransactions);
    db.close();
    self.postMessage(
      transactions.filter((tx) => tx.owner_address == walletAddress),
    );
  } else {
    self.postMessage(transactions);
  }
}

self.onmessage = async (event: MessageEvent<string>) => {
  readData(event.data);
};

export default self;
