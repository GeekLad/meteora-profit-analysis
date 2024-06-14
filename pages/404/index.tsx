import { title } from "@/components/primitives";
import DefaultLayout from "@/layouts/default";

export default function Custom404() {
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
