import { type AnyFunction, ThrottledFunction } from "p-throttle";

export type UnifiedFetcher = (url: string) => Promise<UnifiedResponse>;
export type UnifiedMultiFetcher = (url: string[]) => Promise<UnifiedResponse[]>;

export interface UnifiedResponse {
  text: () => Promise<string>;
}

export interface ThrottledCachedRequestOptions<
  RequestParams extends any[],
  Response,
> {
  fn: (...args: RequestParams) => Promise<Response>;
  throttle?: <F extends AnyFunction>(function_: F) => ThrottledFunction<F>;
  maxAge?: number;
}

export interface ThrottledCachedResponse<Response> {
  loadTime: number;
  response: Response;
}

export async function multiFetch(urls: string[]): Promise<UnifiedResponse[]> {
  return Promise.all(urls.map((url) => fetch(url)));
}

export async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function exponentialRetryDelay<T>(
  fn: () => Promise<T>,
  ms = 1000,
  retries = 0,
  maxRetries = 3,
): Promise<T> {
  try {
    return fn();
  } catch (err) {
    if (retries > maxRetries) {
      const errMsg = `Failed to execute ${fn.toString()} after ${maxRetries} retries`;

      throw new Error(errMsg);
    }
    await delay(ms);

    return exponentialRetryDelay(fn, ms * 2, retries + 1, maxRetries);
  }
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

export function total<T>(arr: Array<T>, key: keyof T): number {
  let sum = 0;

  arr.forEach((obj) => {
    const value = obj[key];

    if (typeof value === "number" && !isNaN(value)) {
      sum += value;
    }
  });

  return sum;
}

export function max<T>(arr: Array<T>, key: keyof T): number {
  let values: number[] = [];

  arr.forEach((obj) => {
    const value = obj[key];

    if (typeof value === "number" && !isNaN(value)) {
      values.push(value);
    }
  });

  return Math.max(...values);
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

function objArrayToCsvString(objArray: Array<Object>): string {
  if (objArray.length == 0) {
    return "";
  }

  const output = Object.keys(objArray[0]).join(",");
  const lines: string[] = [];

  objArray.forEach((obj) => {
    const line = Object.values(obj)
      .map((value) =>
        value !== undefined && value !== null && typeof value != "object"
          ? '"' + value.toString().replace(/"/g, '""') + '"'
          : "",
      )
      .join(",");

    lines.push(line);
  });

  return output + "\n" + lines.join("\n");
}

export function downloadObjArrayAsCsv(
  filename: string,
  objArray: Array<Object>,
) {
  downloadStringToFile(filename, objArrayToCsvString(objArray));
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);

    return true;
  } catch (err) {
    return false;
  }
}

export function getDurationString(duration: number) {
  const estimateInSeconds = Math.floor(duration / 1000);
  const minutes = Math.floor(estimateInSeconds / 60);
  const seconds = estimateInSeconds % 60;

  return `${minutes > 0 ? `${minutes}m, ` : ""}${seconds}s`;
}
