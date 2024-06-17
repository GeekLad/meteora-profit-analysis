import { useEffect, useState } from "react";
import { useRouter } from "next/router";

import { FullPageSpinner } from "@/components/full-page-spinner";
import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function Custom404() {
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const validPath = router.asPath.match(/\/wallet\/.*/);

  useEffect(() => {
    if (validPath) {
      router.push(router.asPath);
    } else {
      setLoading(false);
    }
  }, [router.asPath]);

  if (loading || validPath) {
    return <FullPageSpinner />;
  }

  return (
    <DefaultLayout>
      <section className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-lg text-center justify-center">
          <h1 className={title()}>404 Error: Page not Found</h1>
        </div>
      </section>
    </DefaultLayout>
  );
}
