import { webpack } from "replugged";
import { getClientID } from "./config";

interface AppAssetUtils {
  fetchAssetIds: (clientID: string, key: [string]) => Promise<string[]>;
}

async function getAsset(clientID: string, key: [string]): Promise<string[]> {
  let module = await webpack.waitForModule<AppAssetUtils>(
    webpack.filters.byProps("fetchAssetIds", "getAssetImage"),
  );
  return await module.fetchAssetIds(clientID, key);
}

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
