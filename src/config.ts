import { settings } from "replugged";

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
