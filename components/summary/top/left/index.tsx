import { MeteoraDlmmDownloaderStats } from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "@/components/summary/generate-summary";
import { SummaryLeftComplete } from "@/components/summary/top/left/summary-left-complete";
import { SummaryLeftLoading } from "@/components/summary/top/left/summary-left-loading";

export const SummaryLeft = (props: {
  duration: number;
  done: boolean;
  data: SummaryData;
  stats: MeteoraDlmmDownloaderStats;
}) => {
  if (props.done) {
    return <SummaryLeftComplete {...props} />;
  }

  return <SummaryLeftLoading {...props} />;
};
