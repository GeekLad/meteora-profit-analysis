import type { AnyFunction, ThrottledFunction } from "p-throttle";

export type UnifiedFetcher = (url: string) => Promise<UnifiedResponse>;
type UnifiedMultiFetcher = (url: string[]) => Promise<UnifiedResponse[]>;

interface UnifiedResponse {
  text: () => Promise<string>;
}

interface ThrottledCachedRequestOptions<RequestParams extends any[], Response> {
  fn: (...args: RequestParams) => Promise<Response>;
  throttle?: <F extends AnyFunction>(function_: F) => ThrottledFunction<F>;
  maxAge?: number;
}

interface ThrottledCachedResponse<Response> {
  loadTime: number;
  response: Response;
}

export async function multiFetch(urls: string[]): Promise<UnifiedResponse[]> {
  return Promise.all(urls.map((url) => fetch(url)));
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ThrottledCachedRequest<RequestParams extends any[], Response> {
  private _requestQueue: Map<string, Array<(response: Response) => void>> =
    new Map();
  private _responseCache: Map<string, ThrottledCachedResponse<Response>> =
    new Map();
  private _fetching: Set<string> = new Set();
  private _fn: (...args: RequestParams) => Promise<Response>;
  private _maxAge: number;

  constructor(options: ThrottledCachedRequestOptions<RequestParams, Response>) {
    const { fn, throttle, maxAge } = options;

    this._fn = throttle ? throttle(fn) : fn;
    this._maxAge = maxAge ? maxAge : 1000 * 60 * 5;
  }

  get(...args: RequestParams): Promise<Response> {
    return new Promise(async (resolve: (value: Response) => void) => {
      const argsStr = this._stringifyArgs(args);

      this._queueRequest(argsStr, resolve);

      if (!this._fetching.has(argsStr) && this._requiresRefresh(argsStr)) {
        this._fetching.add(argsStr);
        const response = await this._fn(...args);

        const loadTime = new Date().getTime();

        this._responseCache.set(argsStr, { loadTime, response });
        this._fetching.delete(argsStr);
        this._processQueue(argsStr);
      }
      this._processQueue(argsStr);
    });
  }

  private _stringifyArgs(args: RequestParams) {
    return Object.values(args)
      .map((value) => {
        try {
          return JSON.stringify(value);
        } catch (err) {
          return "";
        }
      })
      .join("");
  }

  private _requiresRefresh(argsStr: string): boolean {
    const response = this._responseCache.get(argsStr);

    return (
      !response ||
      (response && new Date().getTime() - response.loadTime > this._maxAge)
    );
  }

  private _queueRequest(
    argsStr: string,
    resolve: (response: Response) => void,
  ) {
    const existingQueue = this._requestQueue.get(argsStr);

    if (existingQueue) {
      existingQueue.push(resolve);

      return;
    }
    const newQueue: Array<(response: Response) => void> = [resolve];

    this._requestQueue.set(argsStr, newQueue);
  }

  private _processQueue(argsStr: string) {
    const queue = this._requestQueue.get(argsStr)!;

    if (queue.length > 0 && !this._fetching.has(argsStr)) {
    }
    while (queue.length > 0 && !this._fetching.has(argsStr)) {
      queue[0](this._responseCache.get(argsStr)!.response);
      queue.shift();
    }
  }
}

export function throttledCachedRequest<RequestParams extends any[], Response>(
  fn: (...args: RequestParams) => Promise<Response>,
  throttle: <F extends AnyFunction>(function_: F) => ThrottledFunction<F>,
  maxAge?: number,
): (...args: RequestParams) => Promise<Response> {
  const cachedRequest = new ThrottledCachedRequest({ fn, throttle, maxAge });

  return cachedRequest.get.bind(cachedRequest);
}

export function cachedRequest<RequestParams extends any[], Response>(
  fn: (...args: RequestParams) => Promise<Response>,
  maxAge?: number,
): (...args: RequestParams) => Promise<Response> {
  const cachedRequest = new ThrottledCachedRequest({ fn, maxAge });

  return cachedRequest.get.bind(cachedRequest);
}

export function downloadStringToFile(filename: string, text: string) {
  const element = document.createElement("a");

  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function objArrayToCsvString<T extends Object>(
  objArray: Array<T>,
  columns?: Array<keyof T>,
): string {
  if (objArray.length == 0) {
    return "";
  }

  columns = columns ?? (Object.keys(objArray[0]) as Array<keyof T>);

  const output = columns.join(",");
  const lines: string[] = [];

  objArray.forEach((obj) => {
    const line = columns!
      .map((key) => {
        const value = obj[key];

        return value !== undefined && value !== null && typeof value != "object"
          ? '"' + value.toString().replace(/"/g, '""') + '"'
          : "";
      })
      .join(",");

    lines.push(line);
  });

  return output + "\n" + lines.join("\n");
}

export function downloadObjArrayAsCsv<T extends Object>(
  filename: string,
  objArray: Array<T>,
  columns?: Array<keyof T>,
) {
  downloadStringToFile(filename, objArrayToCsvString(objArray, columns));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);

    return true;
  } catch (err) {
    return false;
  }
}

export function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

type SummaryMapping<T> = {
  [metricName: string]:
    | {
        summaryMethod: "count";
        filter?: (t: T) => boolean;
      }
    | {
        summaryMethod: "sum" | "first" | "last";
        key: keyof T;
        filter?: (t: T) => boolean;
        postProcess?: (value: any) => any;
      }
    | {
        summaryMethod: "sum" | "first" | "last";
        expression: (t: T) => any;
        filter?: (t: T) => boolean;
        postProcess?: (value: any) => any;
      }
    | {
        summaryMethod: "custom";
        map: <V>(value: T, index?: number, array?: T[]) => V;
        reduce: <V>(
          previousValue: V,
          currentValue: V,
          currentIndex?: number,
          array?: V[],
        ) => V;
        filter?: (t: T) => boolean;
        postProcess?: (value: any) => any;
      };
};

type Summary<T> = {
  [K in keyof SummaryMapping<T>]: any;
};

export function summarize<T, U>(
  objArray: Array<T>,
  mapping: SummaryMapping<T>,
  target?: Summary<U>,
): Summary<T> {
  const summary: Summary<T> = {};

  Object.entries(mapping).forEach(([metricName, summaryMapping]) => {
    const filteredValues = summaryMapping.filter
      ? objArray.filter(summaryMapping.filter)
      : objArray;

    switch (summaryMapping.summaryMethod) {
      case "count":
        summary[metricName] = filteredValues.length;
        break;

      case "sum":
        summary[metricName] =
          filteredValues.length == 0
            ? 0
            : "key" in summaryMapping
              ? filteredValues
                  .map((value) => Number(value[summaryMapping.key]))
                  .reduce((total, current) => total + current)
              : filteredValues
                  .map((value) => Number(summaryMapping.expression(value)))
                  .reduce((total, current) => total + current);
        break;

      case "first":
        if (filteredValues.length > 0) {
          // @ts-ignore
          summary[metricName] = filteredValues[0][summaryMapping.key];
        }
        break;

      case "last":
        if (filteredValues.length > 0) {
          summary[metricName] =
            // @ts-ignore
            filteredValues[filteredValues.length - 1][summaryMapping.key];
        }
        break;

      case "custom":
        if (filteredValues.length > 0) {
          summary[metricName] = filteredValues
            .map((value: T, index?: number, array?: T[]) =>
              summaryMapping.map(value, index, array),
            )
            .reduce(
              <V>(
                previousValue: V,
                currentValue: V,
                currentIndex?: number,
                array?: V[],
              ) =>
                summaryMapping.reduce(
                  previousValue,
                  currentValue,
                  currentIndex,
                  array,
                ),
            );
        }
        break;
    }

    if ("postProcess" in summaryMapping && metricName in summary) {
      // @ts-ignore
      summary[metricName] = summaryMapping.postProcess(summary[metricName]);
    }

    if (target && metricName in summary) {
      target[metricName] = summary[metricName];
    }
  });

  return summary;
}

export function getDurationString(duration: number) {
  const estimateInSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(estimateInSeconds / 60);
  const seconds = estimateInSeconds % 60;

  return `${minutes > 0 ? `${minutes}m, ` : ""}${seconds}s`;
}

interface ProcessedResult<R> {
  inputCount: number;
  output: R[];
}

export class AsyncBatchProcessor<T, R> {
  private inputQueue: T[][] = [];
  private processingMap: Map<number, Promise<R[]>> = new Map();
  private nextOutputIndex = 0;
  private processing = false;
  private resolveNext: ((value: ProcessedResult<R>) => void) | null = null;

  constructor(private _processingFunction: (batch: T[]) => Promise<R[]>) {}

  async addBatch(batch: T[]): Promise<void> {
    const index = this.inputQueue.length;

    this.inputQueue.push(batch);
    this.processingMap.set(index, this._processingFunction(batch));
    this._processQueue();
  }

  private async _processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        const contiguousResults: ProcessedResult<R>[] = [];
        let currentIndex = this.nextOutputIndex;

        while (this.processingMap.has(currentIndex)) {
          const promise = this.processingMap.get(currentIndex)!;

          try {
            const results = await promise;
            const inputCount = this.inputQueue[currentIndex].length;

            contiguousResults.push({ inputCount, output: results });
            this.processingMap.delete(currentIndex);
            currentIndex++;
          } catch (error) {
            // Handle the error if necessary, for now just break the loop
            break;
          }
        }

        if (contiguousResults.length > 0) {
          const mergedResult: ProcessedResult<R> = {
            inputCount: contiguousResults.reduce(
              (sum, result) => sum + result.inputCount,
              0,
            ),
            output: contiguousResults.flatMap((result) => result.output),
          };

          this.nextOutputIndex = currentIndex;

          if (this.resolveNext) {
            this.resolveNext(mergedResult);
            this.resolveNext = null;

            return; // Exit after resolving
          }
        } else {
          break; // No contiguous results, exit the loop
        }
      }
    } finally {
      this.processing = false;
      if (this.processingMap.size > 0) {
        setTimeout(() => this._processQueue(), 0);
      } else if (this.resolveNext) {
        this.resolveNext({ inputCount: 0, output: [] });
        this.resolveNext = null;
      }
    }
  }

  async next(): Promise<ProcessedResult<R>> {
    if (
      this.processingMap.size === 0 &&
      this.inputQueue.length === this.nextOutputIndex
    ) {
      return { inputCount: 0, output: [] };
    }

    return new Promise((resolve) => {
      this.resolveNext = resolve;
      this._processQueue();
    });
  }
}
