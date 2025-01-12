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
  let done = false;
  let start: number;
  let dbReadTime = 0;

  const dbWorker = new Worker(
    new URL("../../public/workers/data-worker", import.meta.url),
  );

  dbWorker.onmessage = async (
    event: MessageEvent<string | MeteoraDlmmDbTransactions[]>,
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

  if (typeof event.data == "string") {
    switch (event.data) {
      case "cancel":
        if (downloader) {
          downloader.cancel();
        }
        break;

      case "reset":
        if (downloader) {
          downloader.cancel();
          downloader.cancel();
        }
        await db.waitForSave();
        db = await MeteoraDlmmDb.create();
        await db.save();
        self.postMessage("reset");
        return;

      default:
        throw new Error(
          `Download worker received unexpected message: "${event.data}"!`,
        );
    }
  } else {
    const { rpc, walletAddress } = event.data;

    db = await MeteoraDlmmDb.load();
    downloader = db.download({
      endpoint: rpc,
      account: walletAddress,
      throttleParameters: {
        rpc: {
          max: 1,
          interval: 1 * 1000,
        },
        meteoraDlmm: {
          max: 4,
          interval: 1 * 1000,
        },
        jupiterTokenList: {
          max: 8,
          interval: 30 * 1000,
        },
      },
      callbacks: {
        onDone: async () => {
          done = true;
          await db.waitForSave();
          db.delaySave = true;
          dbWorker.postMessage(walletAddress);
        },
      },
    });

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
