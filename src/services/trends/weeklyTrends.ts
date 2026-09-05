import AsyncStorage from "@react-native-async-storage/async-storage";
import { getAuthProvider } from "@/services/providers/auth";

export interface WeeklyTrendItem {
  category: "color" | "clothing" | "shoes" | "accessory" | "makeup" | "hair" | "seasonal";
  label: string;
  notes?: string;
}

export interface WeeklyTrendSnapshot {
  source: string;
  sourceUrl?: string;
  fetchedAt: string;
  publishedAt?: string;
  region: string;
  items: WeeklyTrendItem[];
  stale: boolean;
}

const CACHE_KEY_PREFIX = "aibeauty.weeklyTrends.v2";
const MAX_FRESH_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");
const CONFIGURED_FEED_URL = process.env.EXPO_PUBLIC_TREND_FEED_URL?.trim();
const FEED_URL = CONFIGURED_FEED_URL || (API_BASE_URL ? `${API_BASE_URL}/v1/trends/weekly` : undefined);

function cacheKey(region: string) { return `${CACHE_KEY_PREFIX}:${region || "global"}`; }
function validDate(x: unknown) { return typeof x === "string" && !Number.isNaN(Date.parse(x)); }
function validItem(x: any): x is WeeklyTrendItem {
  return !!x && ["color","clothing","shoes","accessory","makeup","hair","seasonal"].includes(x.category) && typeof x.label === "string" && x.label.trim().length > 0;
}

function sanitize(raw: any, region: string): WeeklyTrendSnapshot | null {
  if (!raw || typeof raw.source !== "string" || !Array.isArray(raw.items) || !validDate(raw.fetchedAt)) return null;
  const items = raw.items.filter(validItem).slice(0, 30).map((x: WeeklyTrendItem) => ({ ...x, label: x.label.trim(), notes: x.notes?.trim() }));
  if (!items.length) return null;
  const fetchedAt = raw.fetchedAt;
  return {
    source: raw.source.trim().slice(0, 120),
    sourceUrl: typeof raw.sourceUrl === "string" ? raw.sourceUrl.slice(0, 500) : FEED_URL,
    fetchedAt,
    publishedAt: validDate(raw.publishedAt) ? raw.publishedAt : undefined,
    region: typeof raw.region === "string" ? raw.region : region,
    items,
    stale: Date.now() - Date.parse(fetchedAt) > MAX_FRESH_AGE_MS,
  };
}

async function readCache(region: string): Promise<WeeklyTrendSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(region));
    if (!raw) return null;
    const parsed = sanitize(JSON.parse(raw), region);
    if (!parsed) return null;
    return { ...parsed, stale: Date.now() - Date.parse(parsed.fetchedAt) > MAX_FRESH_AGE_MS };
  } catch { return null; }
}

/** Never fabricates trend data. A failed provider yields a dated cached snapshot or null. */
export async function getWeeklyTrend(region: string, forceRefresh = false): Promise<WeeklyTrendSnapshot | null> {
  const normalizedRegion = region?.trim() || "global";
  const cached = await readCache(normalizedRegion);
  if (!forceRefresh && cached && !cached.stale) return cached;
  if (!FEED_URL || !/^https:\/\//i.test(FEED_URL)) return cached ? { ...cached, stale: true } : null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const sep = FEED_URL.includes("?") ? "&" : "?";
    const headers: Record<string, string> = { accept: "application/json" };
    // The first-party backend trend proxy is authenticated. A separately
    // configured third-party feed is never sent the app bearer token.
    if (!CONFIGURED_FEED_URL && API_BASE_URL && FEED_URL.startsWith(API_BASE_URL)) {
      const token = await getAuthProvider().getToken();
      if (!token) throw new Error("trend_auth_required");
      headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(`${FEED_URL}${sep}region=${encodeURIComponent(normalizedRegion)}`, {
      signal: controller.signal,
      headers,
    });
    if (!res.ok) throw new Error(`trend_feed_${res.status}`);
    const parsed = sanitize(await res.json(), normalizedRegion);
    if (!parsed) throw new Error("invalid_trend_feed");
    const fresh = { ...parsed, region: normalizedRegion, stale: false };
    await AsyncStorage.setItem(cacheKey(normalizedRegion), JSON.stringify(fresh));
    return fresh;
  } catch {
    return cached ? { ...cached, stale: true } : null;
  } finally { clearTimeout(timer); }
}
