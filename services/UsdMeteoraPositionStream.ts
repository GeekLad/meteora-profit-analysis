import { Transform } from "stream";

import { MeteoraPosition } from "./MeteoraPosition";
import { addMeteoraApiData } from "./AddMeteoraApiData";

interface UsdMeteoraPositionStreamUpdatedPosition {
  type: "updatedPosition";
  updatedPositionCount: number;
  updatedPosition: MeteoraPosition;
}

export type UsdMeteoraPositionStreamData =
  UsdMeteoraPositionStreamUpdatedPosition;

interface UsdMeteoraPositionStreamEvents {
  data: (data: UsdMeteoraPositionStreamData) => void;
  error: (error: Error) => void;
  end: () => void;
}

export class UsdMeteoraPositionStream extends Transform {
  private _positions: MeteoraPosition[];
  private _updatedPositionCount = 0;

  constructor(positions: MeteoraPosition[]) {
    super({ objectMode: true });
    this._positions = positions.sort(
      (a, b) => b.openTimestampMs - a.openTimestampMs,
    );
    this._init();
  }

  private async _init() {
    await Promise.all(
      this._positions.map(async (position) => {
        await addMeteoraApiData(position);
        this._updatedPositionCount++;
        this.push({
          type: "updatedPosition",
          updatedPositionCount: this._updatedPositionCount,
          updatedPosition: position,
        });

        return position;
      }),
    );
    this.push(null);
  }

  on<Event extends keyof UsdMeteoraPositionStreamEvents>(
    event: Event,
    listener: UsdMeteoraPositionStreamEvents[Event],
  ): this {
    return super.on(event, listener);
  }

  emit<Event extends keyof UsdMeteoraPositionStreamEvents>(
    event: Event,
    ...args: Parameters<UsdMeteoraPositionStreamEvents[Event]>
  ): boolean {
    return super.emit(event, ...args);
  }

  push(
    chunk: UsdMeteoraPositionStreamData | null,
    encoding?: BufferEncoding,
  ): boolean {
    return super.push(chunk, encoding);
  }
}
