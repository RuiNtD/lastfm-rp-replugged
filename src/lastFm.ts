import { z } from "zod";
import { getLastFMKey } from "./config";
import { LASTFM_UA } from "./constants";

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

async function sendRequest(params: Record<string, string>): Promise<unknown> {
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": LASTFM_UA,
  });

  const newParams = new URLSearchParams({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    api_key: getLastFMKey(),
    format: "json",
    ...params,
  });

  const req = await fetch(`${baseURL}${newParams}`, {
    headers,
  });
  const json = await req.json();

  const error = LastFMError.safeParse(json);
  if (error.success)
    throw new Error(`Error ${error.data.error}: ${error.data.message}`);

  return json;
}

export async function getLastTrack(user: string): Promise<LastFMTrack> {
  const tracks = await sendRequest({
    method: "user.getrecenttracks",
    user,
    limit: "1",
  });

  return LastFMTracks.parse(tracks).recenttracks.track[0];
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

let cachedUser: LastFMUser | undefined;

export async function getUser(user: string): Promise<LastFMUser> {
  if (cachedUser && cachedUser.name.toLowerCase() == user.toLowerCase())
    return cachedUser;

  const info = await sendRequest({
    method: "user.getinfo",
    user,
  });

  cachedUser = LastAPIUser.parse(info).user;
  return cachedUser;
}
