import { webpack } from "replugged";
import { getClientID } from "./config";

const getAsset: (clientID: string, key: [string]) => Promise<[string]> =
  webpack.getFunctionBySource(
    await webpack.waitForModule(
      webpack.filters.bySource("getAssetImage: size must === [number, number] for Twitch"),
    ),
    "apply(",
  )!;

let cacheID = "";
const cache = new Map<string, string>();

export async function getAppAsset(key: string): Promise<string> {
  if (cacheID != getClientID()) {
    cacheID = getClientID();
    cache.clear();
  }

  let ret = cache.get(key);
  if (ret) return ret;

  ret = (await getAsset(getClientID(), [key]))[0];
  cache.set(key, ret);
  return ret;
}
