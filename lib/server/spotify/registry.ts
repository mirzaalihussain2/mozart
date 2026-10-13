import "server-only";
import { getAppUrl } from "../app-url";

export type SpotifyAppKey =
  | "mozart"
  | "mediamatch"
  | "musicmundays"
  | "podbro"
  | "audiobro"
  | "podbash";

export interface SpotifyAppConfig {
  key: SpotifyAppKey;
  name: string;
  clientId: string | null;
  clientSecret: string | null;
  productionDomain: string;
}

export const SPOTIFY_APPS: Record<SpotifyAppKey, { name: string; productionDomain: string }> = {
  mozart: {
    name: "Mozart",
    productionDomain: "maestro-mozart.vercel.app",
  },
  mediamatch: {
    name: "MediaMatch",
    productionDomain: "mediamatch-bach.vercel.app",
  },
  musicmundays: {
    name: "MusicMundays",
    productionDomain: "musicmundays-chopin.vercel.app",
  },
  podbro: {
    name: "PodBro",
    productionDomain: "podbro-beethoven.vercel.app",
  },
  audiobro: {
    name: "AudioBro",
    productionDomain: "audiobro-vivaldi.vercel.app",
  },
  podbash: {
    name: "PodBash",
    productionDomain: "podbash-wagner.vercel.app",
  },
};

export const DEFAULT_SPOTIFY_APP_KEY: SpotifyAppKey = "mozart";

export function isSpotifyAppKey(value: unknown): value is SpotifyAppKey {
  return typeof value === "string" && value in SPOTIFY_APPS;
}

export function getSpotifyAppCredentials(key: SpotifyAppKey): { clientId: string | null; clientSecret: string | null } {
  switch (key) {
    case "mozart":
      return {
        clientId:
          process.env.SPOTIFY_CLIENT_1_MOZART ||
          process.env.SPOTIFY_CLIENT_ID_1_MOZART ||
          process.env.SPOTIFY_CLIENT_ID ||
          null,
        clientSecret:
          process.env.SPOTIFY_CLIENT_SECRET_1_MOZART ||
          process.env.SPOTIFY_CLIENT_SECRET ||
          null,
      };
    case "mediamatch":
      return {
        clientId: process.env.SPOTIFY_CLIENT_ID_2_MEDIAMATCH || null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET_2_MEDIAMATCH || null,
      };
    case "musicmundays":
      return {
        clientId: process.env.SPOTIFY_CLIENT_ID_3_MUSICMUNDAYS || null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET_3_MUSICMUNDAYS || null,
      };
    case "podbro":
      return {
        clientId: process.env.SPOTIFY_CLIENT_ID_4_PODBRO || null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET_4_PODBRO || null,
      };
    case "audiobro":
      return {
        clientId: process.env.SPOTIFY_CLIENT_ID_5_AUDIOBRO || null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET_5_AUDIOBRO || null,
      };
    case "podbash":
      return {
        clientId: process.env.SPOTIFY_CLIENT_ID_6_PODBASH || null,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET_6_PODBASH || null,
      };
  }
}

export function getSpotifyApp(key?: string | null): SpotifyAppConfig {
  const appKey: SpotifyAppKey = isSpotifyAppKey(key) ? key : DEFAULT_SPOTIFY_APP_KEY;
  const meta = SPOTIFY_APPS[appKey];
  const creds = getSpotifyAppCredentials(appKey);
  return {
    key: appKey,
    name: meta.name,
    productionDomain: meta.productionDomain,
    clientId: creds.clientId,
    clientSecret: creds.clientSecret,
  };
}

export function getSpotifyAppByHost(host?: string | null): SpotifyAppConfig {
  if (!host) return getSpotifyApp(DEFAULT_SPOTIFY_APP_KEY);
  const cleanHost = host.split(":")[0].toLowerCase();
  for (const [key, meta] of Object.entries(SPOTIFY_APPS) as [SpotifyAppKey, { name: string; productionDomain: string }][]) {
    if (meta.productionDomain.toLowerCase() === cleanHost) {
      return getSpotifyApp(key);
    }
  }
  return getSpotifyApp(DEFAULT_SPOTIFY_APP_KEY);
}

export function resolveSpotifyApp({
  queryApp,
  cookieApp,
  host,
}: {
  queryApp?: string | null;
  cookieApp?: string | null;
  host?: string | null;
}): SpotifyAppConfig {
  if (queryApp && isSpotifyAppKey(queryApp.toLowerCase())) {
    return getSpotifyApp(queryApp.toLowerCase() as SpotifyAppKey);
  }
  if (cookieApp && isSpotifyAppKey(cookieApp.toLowerCase())) {
    return getSpotifyApp(cookieApp.toLowerCase() as SpotifyAppKey);
  }
  if (host) {
    const fromHost = getSpotifyAppByHost(host);
    if (fromHost.key !== DEFAULT_SPOTIFY_APP_KEY) {
      return fromHost;
    }
  }
  return getSpotifyApp(DEFAULT_SPOTIFY_APP_KEY);
}

export function isSpotifyAppEnabled(app: SpotifyAppConfig | SpotifyAppKey): boolean {
  const config = typeof app === "string" ? getSpotifyApp(app) : app;
  return !!config.clientId && !!config.clientSecret && process.env.VERCEL_ENV !== "preview";
}

export function resolveRedirectUriForDomain(app: SpotifyAppConfig, baseAppUrl: string): string {
  if (baseAppUrl.includes("127.0.0.1") || baseAppUrl.includes("localhost")) {
    return `${baseAppUrl.replace(/\/$/, "")}/auth/spotify/callback`;
  }
  if (app.productionDomain) {
    return `https://${app.productionDomain}/auth/spotify/callback`;
  }
  return `${baseAppUrl.replace(/\/$/, "")}/auth/spotify/callback`;
}

export async function getSpotifyRedirectUri(app: SpotifyAppConfig): Promise<string> {
  const base = await getAppUrl();
  return resolveRedirectUriForDomain(app, base);
}

export function listSpotifyApps(): Array<Omit<SpotifyAppConfig, "clientSecret"> & { enabled: boolean }> {
  return (Object.keys(SPOTIFY_APPS) as SpotifyAppKey[]).map((key) => {
    const app = getSpotifyApp(key);
    return {
      key: app.key,
      name: app.name,
      clientId: app.clientId,
      productionDomain: app.productionDomain,
      enabled: isSpotifyAppEnabled(app),
    };
  });
}
