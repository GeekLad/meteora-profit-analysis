import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { MeteoraDlmmDb } from "@geeklad/meteora-dlmm-db/dist";
import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { Summary } from "@/components/summary";
import { AppState } from "@/pages/_app";
import DefaultLayout from "@/layouts/default";
import { FullPageSpinner } from "@/components/full-page-spinner";

export default function IndexPage() {
  const appState = useContext(AppState);
  const router = useRouter();

  const [db, setDb] = useState(undefined as undefined | MeteoraDlmmDb);
  const [downloader, setDownloader] = useState(
    undefined as undefined | MeteoraDownloader,
  );

  useEffect(() => {
    if (router.query.walletAddress && (!db || !downloader)) {
      loadTransactions(router.query.walletAddress as string);
    }
  }, [router.query.walletAddress]);

  async function loadTransactions(walletAddress: string) {
    if (!db) {
      const db = await MeteoraDlmmDb.load();
      const downloader = db.download(appState.rpc, walletAddress);

      setDb(db);
      setDownloader(downloader);
    }
  }

  if (!db || !downloader) {
    return <FullPageSpinner />;
  }

  return (
    <DefaultLayout>
      <Summary db={db} downloader={downloader} />
    </DefaultLayout>
  );
}
