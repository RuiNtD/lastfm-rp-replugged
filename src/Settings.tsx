import { common, components, util } from "replugged";
import { cfg } from "./config";
import { CLIENT_ID, LASTFM_KEY } from "./constants";

const { React } = common;
const { Divider, Text, TextInput, SwitchItem, FormText } = components;

export function Settings(): React.ReactElement {
  return (
    <div>
      <Text.Eyebrow style={{ marginBottom: "5px" }}>Last.fm Username</Text.Eyebrow>
      <TextInput {...util.useSetting(cfg, "username")} />
      <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />

      <Text.Eyebrow style={{ marginBottom: "5px" }}>App Name</Text.Eyebrow>
      <TextInput {...util.useSetting(cfg, "appName")} placeholder="Music" />
      <FormText.DESCRIPTION style={{ marginTop: "8px" }}>
        "{"{title}"}" is replaced with current track name<br/>
        "{"{artist}"}" is replaced with current track artist<br/>
        "{"{album}"}" is replaced with current track album name
      </FormText.DESCRIPTION>
      <Divider style={{ marginTop: "10px", marginBottom: "20px" }} />

      <SwitchItem
        {...util.useSetting(cfg, "shareUsername")}
        note="Adds a link to your profile and your profile picture">
        Share Username
      </SwitchItem>

      <SwitchItem
        {...util.useSetting(cfg, "ignoreIfOtherApps")}
        note="Spotify, Cider, PreMiD, iTunes Rich Presence, etc">
        Disable if other music apps are detected
      </SwitchItem>

      <Text.Eyebrow style={{ marginBottom: "5px" }}>Discord Client ID</Text.Eyebrow>
      <TextInput {...util.useSetting(cfg, "clientID")} placeholder={CLIENT_ID} />
      <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />

      <Text.Eyebrow style={{ marginBottom: "5px" }}>Last.fm API Key</Text.Eyebrow>
      <TextInput {...util.useSetting(cfg, "lastFMKey")} placeholder={LASTFM_KEY} />
      <Divider style={{ marginTop: "10px", marginBottom: "10px" }} />
    </div>
  );
}
