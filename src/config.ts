import { settings } from "replugged";
import { CLIENT_ID, LASTFM_KEY } from "./constants";

interface Settings {
  username?: string;
  appName?: string;
  shareUsername?: boolean;
  ignoreIfOtherApps?: boolean;
  clientID?: string;
  lastFMKey?: string;
}

const defaultSettings: Partial<Settings> = {
  appName: "Music",
  shareUsername: true,
  ignoreIfOtherApps: true,
};

export const cfg = await settings.init<Settings, keyof typeof defaultSettings>(
  "LASTFM_RP",
  defaultSettings,
);

export function getClientID(): string {
  return cfg.get("clientID") || CLIENT_ID;
}

export function getLastFMKey(): string {
  return cfg.get("lastFMKey") || LASTFM_KEY;
}
