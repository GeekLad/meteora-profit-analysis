"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { FullPageSpinner } from "@/components/full-page-spinner";
import { subtitle, title } from "@/components/primitives";
import { WalletForm } from "@/components/wallet-form";
import { useAppStateContext } from "@/app/providers";
import { siteConfig } from "@/config/site";

export default function Home() {
  const appState = useAppStateContext();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (loading) {
    return <FullPageSpinner />;
  }

  async function loadTransactions(walletAddress: string) {
    setLoading(true);
    router.push(`/wallet/${walletAddress}`);
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <h1 className={title()}>{siteConfig.name}</h1>
        <h4 className={subtitle({ class: "mt-4" })}>
          {siteConfig.description}
        </h4>
      </div>
      <div className="flex-1 flex flex-col w-full items-center">
        <WalletForm
          appState={appState}
          loadTransactions={(walletAddress) => loadTransactions(walletAddress)}
        />
      </div>
    </section>
  );
}
