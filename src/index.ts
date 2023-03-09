import { Logger, common, webpack } from "replugged";
import { clientID, OtherAppIDs } from "./constants";
import { Activity, ActivityButton, ActivityFlags, ActivityType } from "./types";
import { getLastTrack, getUser, LastFMTrack } from "./lastFm";

const getActivities = (await webpack.waitForProps("getActivities"))
  .getActivities as () => Activity[];

const getAsset = webpack.getFunctionBySource(
  await webpack.waitForModule(
    webpack.filters.bySource("getAssetImage: size must === [number, number] for Twitch"),
  ),
  "apply(",
) as (clientID: string, key: [string]) => Promise<[string]>;

async function getAppAsset(key: string): Promise<string> {
  return (await getAsset(clientID, [key]))[0];
}

function setActivity(activity: Activity | null) {
  common.fluxDispatcher.dispatch({
    type: "LOCAL_ACTIVITY_UPDATE",
    activity,
    socketId: "io.github.ruintd.LastFMRP",
  });
}

const logger = Logger.plugin("Last.fm RP", "#ba0000");

async function runTimer() {
  logger.log("Timer!");

  const activity = (await getActivity()) || null;
  logger.log("Received activity", activity);
  setActivity(activity);
}

function hasOtherActivity(): boolean {
  // TODO: Add setting
  if (false) return false;

  const activities = getActivities();
  if (!activities) return false;

  for (const activity of activities) {
    const appID = activity.application_id;
    if (appID == clientID) continue;
    if (activity.type == 2) return true;
    if (!appID) continue;

    if (OtherAppIDs.includes(appID)) return true;
  }

  return false;
}

async function getActivity(): Promise<Activity | undefined> {
  if (hasOtherActivity()) {
    logger.warn("Found other activity. Cancelling.");
    return;
  }

  let track: LastFMTrack;
  try {
    // TODO: Add setting
    track = await getLastTrack("RuiNtD");
  } catch (e) {
    logger.error("Failed to get last track");
    logger.error(e);
    return;
  }

  if (!track) {
    logger.warn("No tracks found?");
    return;
  }

  if (!track["@attr"]?.nowplaying) {
    logger.warn("Nothing playing!");
    return;
  }

  const buttons: ActivityButton[] = [];
  let small_image = "lastfm";
  let small_text = "Scrobbling now";

  if (true) {
    try {
      const user = await getUser("RuiNtD");
      buttons.push({
        label: "Last.fm Profile",
        url: user.url,
      });
      small_text += ` as ${user.name}`;

      small_image = user.image[user.image.length - 1]["#text"] || "lastfm";
    } catch {}
  }

  small_text += " on Last.fm";
  buttons.push({
    label: "View Song",
    url: track.url,
  });

  const large_image = track.image[track.image.length - 1]["#text"] || "placeholdersong";
  return {
    name: "Music",
    application_id: clientID,

    type: ActivityType.Listening,
    flags: ActivityFlags.Instance,

    details: track.name,
    state: track.artist["#text"] ? `by ${track.artist["#text"]}` : "",

    assets: {
      large_image: await getAppAsset(large_image),
      large_text: track.album["#text"],
      small_image: await getAppAsset(small_image),
      small_text,
    },

    timestamps: {
      start: track.date?.uts,
    },

    buttons: buttons.map((v) => v.label),
    metadata: {
      button_urls: buttons.map((v) => v.url),
    },
  };
}

let timer: NodeJS.Timer;
export async function start(): Promise<void> {
  runTimer();
  timer = setInterval(runTimer, 10_000);
}

export function stop(): void {
  clearInterval(timer);
}
