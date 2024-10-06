import MeteoraDownloaderStream from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { SummaryLeftComplete } from "@/components/summary/top/left/summary-left-complete";
import { SummaryLeftLoading } from "@/components/summary/top/left/summary-left-loading";

export const SummaryLeft = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloaderStream;
}) => {
  if (props.done) {
    return <SummaryLeftComplete {...props} />;
  }

  return <SummaryLeftLoading {...props} />;
};
