/**
 * Thin Reddit OAuth client. No snoowrap dependency.
 *
 * Supports two auth flows:
 *  1) script app + ROPC (REDDIT_USERNAME + REDDIT_PASSWORD)
 *  2) installed/web app + refresh token (REDDIT_REFRESH_TOKEN)
 *
 * Required env in both modes:
 *  - REDDIT_CLIENT_ID
 *  - REDDIT_CLIENT_SECRET (empty string for installed apps)
 *  - REDDIT_USER_AGENT  (e.g. "wynner/1.0 by u/yourname")
 */

const TOKEN_URL = "https://www.reddit.com/api/v1/access_token";
const API_BASE = "https://oauth.reddit.com";

// In-memory rate-limit bucket: 60 requests / minute per process.
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60;
const requestTimestamps: number[] = [];

let cachedToken: { token: string; expiresAt: number; username?: string } | null = null;

export class RedditError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type RedditConfig = {
  clientId: string;
  clientSecret: string;
  userAgent: string;
  refreshToken?: string;
  username?: string;
  password?: string;
};

export function readRedditConfig(): RedditConfig | null {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET ?? "";
  const userAgent = process.env.REDDIT_USER_AGENT;
  if (!clientId || !userAgent) return null;
  const refreshToken = process.env.REDDIT_REFRESH_TOKEN || undefined;
  const username = process.env.REDDIT_USERNAME || undefined;
  const password = process.env.REDDIT_PASSWORD || undefined;
  if (!refreshToken && !(username && password)) return null;
  return { clientId, clientSecret, userAgent, refreshToken, username, password };
}

export function isRedditConfigured(): boolean {
  return readRedditConfig() !== null;
}

async function rateLimitedSleep(): Promise<void> {
  const now = Date.now();
  // Trim old timestamps
  while (requestTimestamps.length && now - requestTimestamps[0] > RATE_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RATE_MAX) {
    const oldest = requestTimestamps[0];
    const wait = RATE_WINDOW_MS - (now - oldest) + 50;
    await new Promise((r) => setTimeout(r, wait));
  }
  requestTimestamps.push(Date.now());
}

async function fetchToken(): Promise<{ token: string; ttlSec: number; username?: string }> {
  const cfg = readRedditConfig();
  if (!cfg) throw new RedditError("Reddit not configured", 401);

  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString("base64");
  const body = new URLSearchParams();
  if (cfg.refreshToken) {
    body.set("grant_type", "refresh_token");
    body.set("refresh_token", cfg.refreshToken);
  } else if (cfg.username && cfg.password) {
    body.set("grant_type", "password");
    body.set("username", cfg.username);
    body.set("password", cfg.password);
  } else {
    throw new RedditError("Reddit credentials incomplete", 401);
  }

  const resp = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": cfg.userAgent,
    },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new RedditError(
      `Reddit token endpoint returned ${resp.status} — ${text.slice(0, 160)}`,
      resp.status,
    );
  }
  const data = (await resp.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
  };
  if (!data.access_token) {
    throw new RedditError(
      data.error ? `Reddit auth: ${data.error}` : "Reddit auth: no access_token",
      401,
    );
  }
  return { token: data.access_token, ttlSec: data.expires_in ?? 3600, username: cfg.username };
}

async function getToken(): Promise<{ token: string; username?: string }> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return { token: cachedToken.token, username: cachedToken.username };
  }
  const { token, ttlSec, username } = await fetchToken();
  cachedToken = {
    token,
    expiresAt: Date.now() + ttlSec * 1000,
    username,
  };
  return { token, username };
}

async function redditFetch<T>(path: string): Promise<T> {
  const cfg = readRedditConfig();
  if (!cfg) throw new RedditError("Reddit not configured", 401);
  await rateLimitedSleep();
  const { token } = await getToken();
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": cfg.userAgent,
    },
  });
  if (resp.status === 401) {
    cachedToken = null;
    throw new RedditError("Reddit returned 401 — token will retry next call", 401);
  }
  if (resp.status === 429) {
    throw new RedditError("Reddit rate limit (429)", 429);
  }
  if (!resp.ok) {
    throw new RedditError(`Reddit ${resp.status} on ${path}`, resp.status);
  }
  return (await resp.json()) as T;
}

// ---------- Public API ----------

export type RedditPost = {
  id: string;
  subreddit: string;
  title: string;
  selftext: string;
  ups: number;
  num_comments: number;
  permalink: string;
  created_utc: number;
  author: string;
};

export type RedditComment = {
  id: string;
  body: string;
  ups: number;
  author: string;
  permalink: string;
};

export type SubredditCandidate = {
  name: string; // without "r/"
  subscribers: number;
  public_description: string;
};

type ListingResp<T> = {
  data?: { children?: { data: T }[] };
};

export async function findSubreddits(
  query: string,
  limit = 8,
): Promise<SubredditCandidate[]> {
  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(limit, 25)),
    include_over_18: "false",
  });
  const json = await redditFetch<ListingResp<SubredditCandidate>>(
    `/subreddits/search?${params}`,
  );
  const subs = (json.data?.children ?? []).map((c) => c.data);
  return subs.filter((s) => s.subscribers >= 1_000);
}

export async function fetchHotPosts(
  subreddit: string,
  limit = 10,
  time: "month" | "year" = "year",
): Promise<RedditPost[]> {
  // /r/<sub>/top?t=year
  const params = new URLSearchParams({
    t: time,
    limit: String(Math.min(limit, 25)),
  });
  const json = await redditFetch<ListingResp<RedditPost>>(
    `/r/${encodeURIComponent(subreddit)}/top?${params}`,
  );
  return (json.data?.children ?? []).map((c) => c.data);
}

export async function searchSubredditPosts(
  subreddit: string,
  query: string,
  limit = 10,
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: query,
    restrict_sr: "1",
    sort: "relevance",
    t: "year",
    limit: String(Math.min(limit, 25)),
  });
  const json = await redditFetch<ListingResp<RedditPost>>(
    `/r/${encodeURIComponent(subreddit)}/search?${params}`,
  );
  return (json.data?.children ?? []).map((c) => c.data);
}

export async function fetchPostComments(
  subreddit: string,
  postId: string,
  limit = 10,
): Promise<RedditComment[]> {
  // /r/<sub>/comments/<id>.json
  const params = new URLSearchParams({
    limit: String(Math.min(limit, 50)),
    depth: "1",
    sort: "top",
  });
  const json = await redditFetch<
    [ListingResp<RedditPost>, ListingResp<RedditComment>]
  >(`/r/${encodeURIComponent(subreddit)}/comments/${postId}?${params}`);
  const listing = Array.isArray(json) ? json[1] : null;
  const children = listing?.data?.children ?? [];
  return children
    .map((c) => c.data)
    .filter((c) => c && typeof c.body === "string" && c.body.length > 4);
}

// Cheap config probe — does NOT hit Reddit.
export function getConfiguredUsername(): string | null {
  const cfg = readRedditConfig();
  if (!cfg) return null;
  if (cfg.username) return cfg.username;
  if (cachedToken?.username) return cachedToken.username;
  return null;
}

// Used by /api/voice/test — performs the cheapest possible authenticated call.
export async function testRedditConnection(): Promise<{
  ok: boolean;
  username?: string;
  error?: string;
}> {
  try {
    if (!isRedditConfigured()) {
      return { ok: false, error: "Reddit env vars not set" };
    }
    type MeResp = { name?: string };
    const me = await redditFetch<MeResp>("/api/v1/me");
    const username = me?.name ?? getConfiguredUsername() ?? undefined;
    return { ok: true, username };
  } catch (e) {
    const err = e instanceof RedditError ? e.message : "Unknown error";
    return { ok: false, error: err };
  }
}
