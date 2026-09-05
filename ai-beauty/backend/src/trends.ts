const TREND_MAX_ITEMS = 30;
const TREND_CACHE_MS = 6 * 60 * 60 * 1000;
const TREND_TIMEOUT_MS = 7000;
const CATEGORIES = new Set(["color","clothing","shoes","accessory","makeup","hair","seasonal"]);

type TrendItem = { category: string; label: string; notes?: string };
type TrendSnapshot = {
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  fetchedAt: string;
  region: string;
  items: TrendItem[];
};

let memoryCache: { key: string; at: number; value: TrendSnapshot } | null = null;

function cleanString(v: unknown, max: number) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function normalize(raw: any, region: string, sourceUrl: string): TrendSnapshot | null {
  const source = cleanString(raw?.source, 120);
  if (!source || !Array.isArray(raw?.items)) return null;
  const items = raw.items
    .filter((x: any) => x && CATEGORIES.has(x.category) && cleanString(x.label, 160))
    .slice(0, TREND_MAX_ITEMS)
    .map((x: any) => ({
      category: x.category,
      label: cleanString(x.label, 160),
      ...(cleanString(x.notes, 500) ? { notes: cleanString(x.notes, 500) } : {}),
    }));
  if (!items.length) return null;
  const publishedAt = cleanString(raw?.publishedAt, 80);
  if (publishedAt && Number.isNaN(Date.parse(publishedAt))) return null;
  return {
    source,
    sourceUrl: cleanString(raw?.sourceUrl, 500) || sourceUrl,
    ...(publishedAt ? { publishedAt } : {}),
    fetchedAt: new Date().toISOString(),
    region,
    items,
  };
}

export async function fetchWeeklyTrends(region: string): Promise<TrendSnapshot> {
  const upstream = process.env.TREND_SOURCE_URL?.trim();
  if (!upstream || !/^https:\/\//i.test(upstream)) throw new Error("trend_source_not_configured");
  const normalizedRegion = cleanString(region, 32) || "global";
  const key = `${upstream}|${normalizedRegion}`;
  if (memoryCache && memoryCache.key === key && Date.now() - memoryCache.at < TREND_CACHE_MS) return memoryCache.value;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TREND_TIMEOUT_MS);
  try {
    const sep = upstream.includes("?") ? "&" : "?";
    const response = await fetch(`${upstream}${sep}region=${encodeURIComponent(normalizedRegion)}`, {
      signal: controller.signal,
      headers: { accept: "application/json", "user-agent": "AIBeauty-TrendProxy/1.0" },
    });
    if (!response.ok) throw new Error(`trend_source_${response.status}`);
    const value = normalize(await response.json(), normalizedRegion, upstream);
    if (!value) throw new Error("trend_source_payload_invalid");
    memoryCache = { key, at: Date.now(), value };
    return value;
  } finally {
    clearTimeout(timer);
  }
}
