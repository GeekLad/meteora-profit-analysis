import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

import { Summary } from "@/components/summary";
import { AppState } from "@/pages/_app";
import DefaultLayout from "@/layouts/default";
import { FullPageSpinner } from "@/components/full-page-spinner";

export default function IndexPage() {
  const appState = useContext(AppState);
  const router = useRouter();

  const [downloadWorker, setDownloadWorker] = useState(
    undefined as Worker | undefined,
  );

  useEffect(() => {
    if (router.query.walletAddress && !downloadWorker) {
      loadTransactions(router.query.walletAddress as string);
    }
  }, [router.query.walletAddress]);

  async function loadTransactions(walletAddress: string) {
    if (!downloadWorker) {
      const worker = new Worker(
        new URL("../../public/workers/download-worker", import.meta.url),
      );

      worker.postMessage({
        rpc: appState.rpc,
        walletAddress,
      });
      setDownloadWorker(worker);
    }
  }

  if (!downloadWorker) {
    return <FullPageSpinner />;
  }

  return (
    <DefaultLayout>
      <Summary downloadWorker={downloadWorker} />
    </DefaultLayout>
  );
}
