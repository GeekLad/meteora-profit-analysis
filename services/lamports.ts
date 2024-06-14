import {
  JUPITER_TOKEN_ALL_LIST_API,
  JUPITER_TOKEN_STRICT_LIST_API,
} from "./config";
import { JupiterTokenListToken } from "./jupiter-token-list";
import { UnifiedFetcher, UnifiedResponse } from "./util";

type JupiterTokenMap = Map<string, JupiterTokenListToken>;
const STRICT_TOKEN_MAP: JupiterTokenMap = new Map();
const ALL_TOKEN_MAP: JupiterTokenMap = new Map();
const TOKEN_MAP_QUEUE: Array<{
  listType: "strict" | "all";
  resolve: (value: JupiterTokenMap | PromiseLike<JupiterTokenMap>) => void;
}> = [];

async function parseTokenData(
  response: UnifiedResponse,
  map: JupiterTokenMap,
): Promise<JupiterTokenMap> {
  const data: JupiterTokenListToken[] = JSON.parse(await response.text());

  data.forEach((token) => map.set(token.address, token));

  return map;
}

function processQueue() {
  while (TOKEN_MAP_QUEUE.length != 0) {
    const item = TOKEN_MAP_QUEUE.pop();

    if (item) {
      if (item.listType == "strict") {
        item.resolve(STRICT_TOKEN_MAP);
      } else {
        item.resolve(ALL_TOKEN_MAP);
      }
    }
  }
}

export async function getJupiterTokenList(
  fetcher: UnifiedFetcher = fetch,
  listType: "strict" | "all" = "strict",
): Promise<Map<string, JupiterTokenListToken>> {
  return new Promise(async (resolve) => {
    TOKEN_MAP_QUEUE.push({
      listType,
      resolve,
    });

    if (TOKEN_MAP_QUEUE.length == 1) {
      const [strictResponse, allResponse] = await Promise.all([
        fetcher(JUPITER_TOKEN_STRICT_LIST_API),
        fetcher(JUPITER_TOKEN_ALL_LIST_API),
      ]);

      await Promise.all([
        parseTokenData(strictResponse, STRICT_TOKEN_MAP),
        parseTokenData(allResponse, ALL_TOKEN_MAP),
      ]);

      processQueue();
    }
  });
}
