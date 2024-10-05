import MeteoraDownloader from "@geeklad/meteora-dlmm-db/dist/meteora-dlmm-downloader";

import { SummaryData } from "../generate-summary";

import { SummaryLeft } from "@/components/summary/top/left";
import { SummaryRight } from "@/components/summary/top/right";

export const SummaryTop = (props: {
  done: boolean;
  data: SummaryData;
  downloader: MeteoraDownloader;
  cancel: () => any;
  cancelled: boolean;
}) => {
  return (
    <>
      <div className="md:grid md:mr-4 mb-4">
        <SummaryLeft
          data={props.data}
          done={props.done}
          downloader={props.downloader}
        />
      </div>
      <div className="md:ml-4 mb-4">
        <SummaryRight
          cancel={() => props.cancel()}
          cancelled={props.cancelled}
          data={props.data}
          done={props.done}
          downloader={props.downloader}
        />
      </div>
    </>
  );
};
