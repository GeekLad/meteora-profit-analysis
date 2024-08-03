import { getFullJupiterTokenList } from "./JupiterTokenList";
import { getDlmmPairs } from "./MeteoraDlmmApi";
import { unique } from "./util";

async function saveTokenCache() {
  console.log("Fetching tokens and DLMM markets.");

  const [markets, tokens] = await Promise.all([
    getDlmmPairs(),
    getFullJupiterTokenList(),
  ]);

  console.log("Finding unique tokens.");

  const tokenAddresses = unique(
    Array.from(markets.pairs.values())
      .map((pair) => [
        pair.mint_x,
        pair.mint_y,
        pair.reward_mint_x,
        pair.reward_mint_y,
      ])
      .flat(),
  );

  console.log("Saving json file, this will take a moment.");

  const dlmmTokens = tokens.filter((token) =>
    tokenAddresses.includes(token.address),
  );

  // @ts-ignore
  Bun.write("./tokens.json", JSON.stringify(dlmmTokens));
}

saveTokenCache();
