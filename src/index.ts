import { Logger, common, webpack } from "replugged";
import { CLIENT_ID, OTHER_APP_IDS } from "./constants";
import { Activity, ActivityAssets, ActivityButton, ActivityFlags, ActivityType } from "./types";
import { LastFMTrack, getLastTrack, getUser } from "./lastFm";
import { cfg } from "./config";

const getActivities = (await webpack.waitForProps("getActivities"))
  .getActivities as () => Activity[];

const getAsset: (clientID: string, key: [string]) => Promise<[string]> =
  webpack.getFunctionBySource(
    await webpack.waitForModule(
      webpack.filters.bySource("getAssetImage: size must === [number, number] for Twitch"),
    ),
    "apply(",
  )!;

async function getAppAsset(key: string): Promise<string> {
  return (await getAsset(CLIENT_ID, [key]))[0];
}

function setActivity(activity: Activity | null): void {
  common.fluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity,
    socketId: "io.github.ruintd.LastFMRP",
  });
}

const logger = Logger.plugin("Last.fm RP", "#ba0000");

async function runTimer(): Promise<void> {
  logger.log("Timer!");

  try {
    const activity = (await getActivity()) || null;
    logger.log("Received activity", activity);
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
    if (appID == CLIENT_ID) continue;
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

  /* eslint-disable @typescript-eslint/naming-convention */
  return {
    name: cfg.get("appName") || "Music",
    application_id: cfg.get("clientID") || CLIENT_ID,

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

let timer: NodeJS.Timer;
export async function start(): Promise<void> {
  await runTimer();
  timer = setInterval(runTimer, 10_000);
}

export function stop(): void {
  clearInterval(timer);
}

export { Settings } from "./Settings";
