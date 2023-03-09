import { z } from "zod";
import { LASTFM_KEY } from "./constants.js";

const baseURL = "https://ws.audioscrobbler.com/2.0/?";

export const LastFMError = z.object({ error: z.number(), message: z.string() });
export type LastFMError = z.infer<typeof LastFMError>;

const images = z.tuple([
  z.object({
    size: z.literal("small"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("medium"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("large"),
    "#text": z.literal("").or(z.string().url()),
  }),
  z.object({
    size: z.literal("extralarge"),
    "#text": z.literal("").or(z.string().url()),
  }),
]);

export const LastFMTrack = z.object({
  artist: z.object({
    "#text": z.string(),
  }),
  image: images,
  album: z.object({
    "#text": z.string(),
  }),
  name: z.string(),
  "@attr": z
    .object({
      nowplaying: z
        .enum(["true", "false"])
        .transform((v) => v == "true")
        .optional(),
    })
    .optional(),
  url: z.string().url(),
  date: z
    .object({
      uts: z.coerce.number(),
      "#text": z.string(),
    })
    .optional(),
});
export type LastFMTrack = z.infer<typeof LastFMTrack>;

export const LastFMTracks = z.object({
  recenttracks: z.object({
    track: z.array(LastFMTrack),
  }),
});
export type LastFMTracks = z.infer<typeof LastFMTracks>;

export async function getLastTrack(username: string): Promise<LastFMTrack> {
  const params = new URLSearchParams({
    method: "user.getrecenttracks",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    api_key: LASTFM_KEY,
    format: "json",
    user: username,
    // limit: "1",
  });

  const json = await (await fetch(`${baseURL}${params}`)).json();

  const error = LastFMError.safeParse(json);
  if (error.success) throw new Error(`Error ${error.data.error}: ${error.data.message}`);

  return LastFMTracks.parse(json).recenttracks.track[0];
}

const LastFMUser = z.object({
  name: z.string(),
  age: z.coerce.number(),
  realname: z.string(),
  image: images,
  country: z.string(),
  url: z.string().url(),
});
export type LastFMUser = z.infer<typeof LastFMUser>;

const LastAPIUser = z.object({ user: LastFMUser });

export async function getUser(username: string): Promise<LastFMUser> {
  const params = new URLSearchParams({
    method: "user.getinfo",
    // eslint-disable-next-line @typescript-eslint/naming-convention
    api_key: LASTFM_KEY,
    format: "json",
    user: username,
  });

  const json = await (await fetch(`${baseURL}${params}`)).json();

  const error = LastFMError.safeParse(json);
  if (error.success) throw new Error(`Error ${error.data.error}: ${error.data.message}`);

  return LastAPIUser.parse(json).user;
}

// console.log(await getLastTrack("RuiNtD"));
// console.log(await getUser("RuiNtD"));
