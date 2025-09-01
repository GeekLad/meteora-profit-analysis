"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { FullPageSpinner } from "@/components/full-page-spinner";
import { title } from "@/components/primitives";

export default function Custom404() {
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const validPath = pathname.match(/\/wallet\/.*/);

  const searchParams = useSearchParams();

  // Combine pathname and searchParams to replicate asPath behavior
  const currentPath = searchParams.toString()
    ? `${pathname}?${searchParams.toString()}`
    : pathname;
  console.log(currentPath);
  console.log(pathname);

  useEffect(() => {
    if (validPath) {
      router.push(pathname);
    } else {
      setLoading(false);
    }
  }, [pathname]);

  if (loading || validPath) {
    return <FullPageSpinner />;
  }

  return (
    <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-lg text-center justify-center">
        <h1 className={title()}>404 Error: Page not Found</h1>
      </div>
    </section>
  );
}
