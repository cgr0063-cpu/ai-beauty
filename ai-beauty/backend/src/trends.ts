const TREND_MAX_ITEMS = 30;
const TREND_CACHE_MS = 7 * 24 * 60 * 60 * 1000;
const TREND_TIMEOUT_MS = 20000;
const CATEGORIES = new Set(["color","clothing","shoes","accessory","makeup","hair","seasonal"]);
const TREND_QUERIES = { color: "fashion color trends", clothing: "womens clothing trends", shoes: "womens shoe trends", accessory: "fashion accessory trends", makeup: "makeup trends", hair: "hair trends", seasonal: "seasonal fashion trends" } as const;

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

function normalize(raw: any, region: string, sourceUrl: string, category: string = "seasonal"): TrendSnapshot | null {
  const directSource = cleanString(raw?.source, 120);
  if (directSource && Array.isArray(raw?.items)) {
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
      source: directSource,
      sourceUrl: cleanString(raw?.sourceUrl, 500) || sourceUrl,
      ...(publishedAt ? { publishedAt } : {}),
      fetchedAt: new Date().toISOString(),
      region,
      items,
    };
  }

  const body = typeof raw?.body === "string" ? (() => {
    try { return JSON.parse(raw.body); } catch { return null; }
  })() : raw;

  const results = Array.isArray(body?.results) ? body.results : [];
  if (!results.length) return null;

  const items: TrendItem[] = results.slice(0, TREND_MAX_ITEMS).map((r: any) => {
    const keyword = cleanString(body?.search_term, 120) || "fashion beauty trends";
    const direction = cleanString(r?.direction, 40);
    const growth = r?.growth;
    const recentValue = r?.recent_value;
    const notes = [
      direction ? `direction: ${direction}` : "",
      typeof growth === "number" ? `growth: ${growth}` : "",
      typeof recentValue === "number" ? `recent: ${recentValue}` : "",
    ].filter(Boolean).join(", ");

    return {
      category,
      label: keyword,
      ...(notes ? { notes } : {}),
    };
  });

  return {
    source: cleanString(body?.data_source, 120) || "TrendsAPI",
    sourceUrl,
    fetchedAt: new Date().toISOString(),
    region,
    items,
  };
}

export async function fetchWeeklyTrends(region: string): Promise<TrendSnapshot> {
  const upstream = process.env.TREND_SOURCE_URL?.trim() || "https://api.trendsapi.ai/api";
  if (!upstream || !/^https:\/\//i.test(upstream)) throw new Error("trend_source_not_configured");

  const normalizedRegion = cleanString(region, 32) || "global";
  const key = `${upstream}|${normalizedRegion}`;
  if (memoryCache && memoryCache.key === key && Date.now() - memoryCache.at < TREND_CACHE_MS) return memoryCache.value;

  const apiKey = process.env.TRENDSAPI_KEY?.trim();
  if (!apiKey) throw new Error("trends_api_key_not_configured");

  const items: TrendItem[] = [];

  for (const [category, query] of Object.entries(TREND_QUERIES)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TREND_TIMEOUT_MS);

    try {
      const response = await fetch(upstream, {
        method: "POST",
        signal: controller.signal,
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
          "user-agent": "AIBeauty-TrendProxy/1.0",
        },
        body: JSON.stringify({
          mode: "get_growth",
          source: "google search",
          keyword: `${query} ${normalizedRegion}`,
          window: ["1M"],
        }),
      });

      if (!response.ok) continue;
      const value = normalize(await response.json(), normalizedRegion, upstream, category);
      if (value) items.push(...value.items);
    } finally {
      clearTimeout(timer);
    }
  }

  if (!items.length) throw new Error("trend_source_payload_invalid");

  const value: TrendSnapshot = {
    source: "google search",
    sourceUrl: upstream,
    fetchedAt: new Date().toISOString(),
    region: normalizedRegion,
    items: items.slice(0, TREND_MAX_ITEMS),
  };

  memoryCache = { key, at: Date.now(), value };
  return value;
}
