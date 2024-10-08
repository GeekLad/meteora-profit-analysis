import { Spinner } from "@nextui-org/react";

import DefaultLayout from "@/layouts/default";

export const FullPageSpinner = (props: { excludeLayout?: boolean }) => {
  if (props.excludeLayout) {
    return (
      <div className="flex h-full w-full justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <DefaultLayout>
      <div className="flex h-full w-full justify-center items-center">
        <Spinner size="lg" />
      </div>
    </DefaultLayout>
  );
};
