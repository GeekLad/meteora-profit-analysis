import { Spinner } from "@nextui-org/react";

import DefaultLayout from "@/layouts/default";

export const FullPageSpinner = () => {
  return (
    <DefaultLayout>
      <div className="flex h-full w-full justify-center items-center">
        <Spinner size="lg" />
      </div>
    </DefaultLayout>
  );
};
