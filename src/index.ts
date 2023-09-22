import { Logger, common, webpack } from "replugged";
import { OTHER_APP_IDS } from "./constants";
import { Activity, ActivityAssets, ActivityButton, ActivityFlags, ActivityType } from "./types";
import { LastFMTrack, getLastTrack, getUser } from "./lastFm";
import { cfg, getClientID } from "./config";
import { getAppAsset } from "./assetProvider";

const getActivities = (await webpack.waitForProps("getActivities"))
  .getActivities as () => Activity[];

function setActivity(activity: Activity | null): void {
  common.fluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity,
    socketId: "io.github.ruintd.LastFMRP",
  });
}

const logger = Logger.plugin("Last.fm RP", "#ba0000");
let timer: NodeJS.Timer | null;

async function runTimer(): Promise<void> {
  logger.log("Timer!");

  try {
    const activity = (await getActivity()) || null;
    logger.log("Received activity", activity);
    if (timer)
      // Fixes any async weirdness when disabling
      setActivity(activity);
  } catch (e) {
    logger.error("Error getting activity", e);
  }
}

function hasOtherActivity(): boolean {
  if (!cfg.get("ignoreIfOtherApps")) return false;

  const activities = getActivities();
  if (!activities) return false;

  for (const activity of activities) {
    const appID = activity.application_id;
    if (appID == getClientID()) continue;
    if (activity.type == 2) return true;
    if (!appID) continue;

    if (OTHER_APP_IDS.includes(appID)) return true;
  }

  return false;
}

async function getActivity(): Promise<Activity | undefined> {
  const username = cfg.get("username");
  if (!username) {
    logger.log("Username not set");
    return;
  }

  if (hasOtherActivity()) {
    logger.log("Found other activity. Cancelling.");
    return;
  }

  let track: LastFMTrack;
  try {
    track = await getLastTrack(username);
  } catch (e) {
    logger.error("Failed to get last track");
    logger.error(e);
    return;
  }

  if (!track) {
    logger.log("No tracks found?");
    return;
  }

  if (!track["@attr"]?.nowplaying) {
    logger.log("Nothing playing!");
    return;
  }

  const buttons: ActivityButton[] = [];
  const assets: ActivityAssets = {
    /* eslint-disable @typescript-eslint/naming-convention */
    large_image: track.image[track.image.length - 1]["#text"] || "placeholdersong",
    large_text: track.album["#text"],
    small_image: "lastfm",
    small_text: "Scrobbling now",
    /* eslint-enable @typescript-eslint/naming-convention */
  };

  if (cfg.get("shareUsername")) {
    try {
      const user = await getUser(username);
      buttons.push({
        label: "Last.fm Profile",
        url: user.url,
      });
      assets.small_text += ` as ${user.name}`;

      assets.small_image = user.image[user.image.length - 1]["#text"] || "lastfm";
    } catch {}
  }

  assets.small_text += " on Last.fm";
  buttons.push({
    label: "View Song",
    url: track.url,
  });

  if (assets.large_image) assets.large_image = await getAppAsset(assets.large_image);
  if (assets.small_image) assets.small_image = await getAppAsset(assets.small_image);

  let appName = cfg.get("appName") || "Music";
  appName = appName.replace(/{[a-zA-Z0-9]+}/g, function (match) {
    return match === "{title}"
      ? track.name
      : match === "{artist}"
      ? track.artist["#text"]
      : match === "{album}"
      ? track.album["#text"]
      : match;
  });

  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    name: appName,
    application_id: getClientID(),

    type: ActivityType.Listening,
    flags: ActivityFlags.Instance,

    details: track.name,
    state: track.artist["#text"] ? `by ${track.artist["#text"]}` : "",

    assets,

    timestamps: {
      start: track.date?.uts,
    },

    buttons: buttons.map((v) => v.label),
    metadata: {
      button_urls: buttons.map((v) => v.url),
    },
  };
  /* eslint-enable @typescript-eslint/naming-convention */
}

export async function start(): Promise<void> {
  timer = setInterval(runTimer, 10_000);
  await runTimer();
}

export function stop(): void {
  if (timer) clearInterval(timer);
  timer = null;
  setActivity(null);
}

export { Settings } from "./Settings";
