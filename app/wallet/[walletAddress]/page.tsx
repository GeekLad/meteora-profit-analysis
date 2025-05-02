"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { FullPageSpinner } from "@/components/full-page-spinner";
import { Summary } from "@/components/summary";
import { useAppStateContext } from "@/app/providers";

export default function IndexPage() {
  const appState = useAppStateContext();
  const query = useParams();

  const [downloadWorker, setDownloadWorker] = useState(
    undefined as Worker | undefined
  );

  useEffect(() => {
    if (query.walletAddress && !downloadWorker) {
      loadTransactions(query.walletAddress as string);
    }
  }, [query.walletAddress]);

  async function loadTransactions(walletAddress: string) {
    if (!downloadWorker) {
      const worker = new Worker(
        new URL("../../../public/workers/download-worker", import.meta.url)
      );
      worker.postMessage({
        rpc: appState.rpc,
        walletAddress,
      });
      setDownloadWorker(worker);
    }
  }

  useEffect(() => {}, [downloadWorker]);

  if (!downloadWorker) {
    return <FullPageSpinner />;
  }

  return (
    <section className="flex flex-col flex-1">
      <Summary downloadWorker={downloadWorker} />
    </section>
  );
}
