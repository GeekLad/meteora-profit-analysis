import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { SummaryRightComplete } from "@/components/summary/top/right/summary-right-complete";
import { SummaryRightLoading } from "@/components/summary/top/right/summary-right-loading";

export const SummaryRight = (props: {
  done: boolean;
  data: SummaryData;
  stats: MeteoraDlmmDownloaderStats;
  cancel: () => any;
  cancelled: boolean;
}) => {
  if (
    props.done ||
    props.cancelled ||
    props.stats.transactionDownloadCancelled ||
    props.stats.positionsComplete
  ) {
    return <SummaryRightComplete {...props} />;
  }

  return <SummaryRightLoading {...props} />;
};
