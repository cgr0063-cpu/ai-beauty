import fs from 'node:fs';
const read = (p) => fs.readFileSync(p, 'utf8');
const checks = [];
const need = (ok, label) => checks.push({ ok: !!ok, label });
const user = read('src/state/userStore.ts');
const today = read('src/state/todayContextStore.ts');
const hook = read('src/domain/useTodaysLook.ts');
const ai = read('backend/src/ai.ts');
const validation = read('backend/src/validation.ts');
const engine = read('src/domain/lookEngine.ts');
const explore = read('app/(tabs)/explore/index.tsx');
const profile = read('app/(tabs)/profile.tsx');
need(user.includes('coveragePreference'), 'explicit coverage preference persisted');
need(profile.includes('coveragePreferenceHint'), 'coverage preference editable in profile');
need(today.includes('socialContext') && today.includes('companionZodiacSignId'), 'social/date context persisted');
need(explore.includes('socialContext.namePlaceholder') && explore.includes('companionZodiacSignId'), 'date/partner UI wired');
need(hook.includes('previousLookSummary') && hook.includes('companionName'), 'Today input carries personalization and previous look');
need(validation.includes('coveragePreference') && validation.includes('.default("no_preference")'), 'rolling-compatible request validation');
need(ai.includes('never infer modesty') && ai.includes('previousLookSummary'), 'remote AI safety + another diversity prompt');
need(engine.includes('explicitIntensity') && engine.includes('companionZodiac'), 'offline engine respects explicit intensity and companion flavor');
need(!ai.match(/(?:infer|guess)\s+(?:the\s+user'?s\s+)?(?:religion|modesty|culture)\s+from/i), 'no prompt instruction to infer sensitive coverage signals');
for (const lang of ['en','tr','ru']) {
  const d = JSON.parse(read(`src/i18n/locales/${lang}.json`));
  need(d.coveragePreference && d.socialContext && d.lookEngine?.coverageWhy, `${lang} personalization copy present`);
}
const failures = checks.filter(c => !c.ok);
for (const c of checks) console.log(`${c.ok ? 'PASS' : 'FAIL'} ${c.label}`);
console.log(`blocking_p21_issues=${failures.length}`);
process.exit(failures.length ? 1 : 0);
