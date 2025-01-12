import { useContext, useState } from "react";
import { useRouter } from "next/router";

import { AppState } from "./_app";

import { title, subtitle } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";
import { WalletForm } from "@/components/wallet-form";
import { FullPageSpinner } from "@/components/full-page-spinner";

export default function IndexPage() {
  const appState = useContext(AppState);
  const router = useRouter();

  const [loading, setLoading] = useState(false);

  if (loading) {
    return <FullPageSpinner />;
  }

  async function loadTransactions(walletAddress: string) {
    setLoading(true);
    router.push(`/wallet/${walletAddress}`);
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>Meteora DLMM Profit Analysis v3.2</h1>
          <h4 className={subtitle({ class: "mt-4" })}>
            Find out How Much You&rsquo;re Printing
          </h4>
        </div>

        <div className="flex gap-3" />

        <WalletForm
          appState={appState}
          loadTransactions={(walletAddress) => loadTransactions(walletAddress)}
        />
      </section>
    </DefaultLayout>
  );
}
