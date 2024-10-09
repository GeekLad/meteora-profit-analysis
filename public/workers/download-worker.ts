import MeteoraDlmmDb, {
  MeteoraDlmmDbTransactions,
} from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-db";
import MeteoraDlmmDownloader, {
  MeteoraDlmmDownloaderStats,
} from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { delay } from "../../services/util";

declare var self: Worker;

interface DataWorkerParameters {
  rpc: string;
  walletAddress: string;
}

export interface DataWorkerMessage {
  transactions: MeteoraDlmmDbTransactions[];
  stats: MeteoraDlmmDownloaderStats;
}

let db: MeteoraDlmmDb;
let downloader: MeteoraDlmmDownloader;

self.onmessage = async (event: MessageEvent<string | DataWorkerParameters>) => {
  if (typeof event.data == "string") {
    if (downloader) {
      downloader.cancel();
    }
  } else {
    const { rpc, walletAddress } = event.data;
    let done = false;
    let start: number;
    let dbReadTime = 0;

    db = await MeteoraDlmmDb.load();
    downloader = db.download(rpc, walletAddress, {
      onDone: async () => {
        done = true;
        await db.waitForSave();
        db.delaySave = true;
        dbWorker.postMessage(walletAddress);
      },
    });

    const dbWorker = new Worker(
      new URL("../../public/workers/data-worker", import.meta.url),
    );

    dbWorker.onmessage = async (
      event: MessageEvent<MeteoraDlmmDbTransactions[]>,
    ) => {
      const transactions = event.data;
      dbReadTime = Date.now() - start;
      db.delaySave = false;
      const stats = !done
        ? await downloader.stats()
        : { downloadingComplete: true };
      self.postMessage({
        transactions,
        stats,
      } as DataWorkerMessage);
    };

    while (!done) {
      if (!db.delaySave) {
        start = Date.now();
        db.delaySave = true;
        dbWorker.postMessage(walletAddress);
      }
      const delayTime =
        dbReadTime == 0
          ? 250
          : Math.max(1.5 * dbReadTime, Math.min(5000, 3 * dbReadTime));
      await delay(delayTime);
    }
  }
};

export default self;
