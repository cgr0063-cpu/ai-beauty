import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const checks = [];
const expect = (name, ok) => checks.push({ name, ok: !!ok });

const screen = read("app/(tabs)/explore/store.tsx");
const engine = read("src/domain/storeModeEngine.ts");
const provider = read("src/services/providers/ai/RemoteAIProvider.ts");
const server = read("backend/src/server.ts");

expect("store photo uses explicit AI consent", screen.includes("ensureAiPhotoConsent"));
expect("store photo uses dedicated premium analyzer", screen.includes("analyzeStoreProduct"));
expect("manual description fallback remains available", screen.includes("photoAnalysisUnavailable") && screen.includes("effectiveProduct"));
expect("compatibility score is displayed", screen.includes("compatibilityScore"));
expect("engine accepts visual analysis", engine.includes("productAnalysis?: ClosetItemAnalysis"));
expect("engine exposes duplicate count", engine.includes("duplicateCount"));
expect("engine exposes top compatible labels", engine.includes("topCompatibleLabels"));
expect("remote provider calls dedicated store endpoint", provider.includes('"/v1/store/analyze"'));
expect("backend store endpoint requires auth and Plus", server.includes('app.post("/v1/store/analyze", requireAuth, requirePlus, aiLimiter'));
expect("backend does not cache store analysis", server.includes('store_product_analysis_failed') && server.includes('res.setHeader("Cache-Control", "no-store")'));

for (const lang of ["en", "tr", "ru"]) {
  const locale = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  expect(`${lang} store compatibility strings`, !!locale.store?.compatibilityScore && !!locale.store?.photoAnalysisUnavailable && !!locale.store?.topMatches);
}

const failed = checks.filter((x) => !x.ok);
for (const c of checks) console.log(`${c.ok ? "PASS" : "FAIL"} ${c.name}`);
console.log(`blocking_p20_issues=${failed.length}`);
if (failed.length) process.exit(1);
