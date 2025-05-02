import { Spinner } from "@heroui/spinner";

export const FullPageSpinner = (props: { excludeLayout?: boolean }) => {
  if (props.excludeLayout) {
    return (
      <div className="flex h-full w-full justify-center items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <section>
      <div className="flex h-full w-full justify-center items-center">
        <Spinner size="lg" />
      </div>
    </section>
  );
};
