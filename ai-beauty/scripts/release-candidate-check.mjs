import fs from 'node:fs';
import path from 'node:path';

const issues = [];
const warnings = [];
const root = process.cwd();
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const exists = p => fs.existsSync(path.join(root,p));
const requireFile = p => { if (!exists(p)) issues.push(`missing required file: ${p}`); };

const criticalFiles = [
  'app/_layout.tsx','app/index.tsx','app/(auth)/sign-in.tsx','app/(auth)/sign-up.tsx',
  'app/(onboarding)/welcome.tsx','app/(tabs)/home.tsx','app/(tabs)/saved.tsx',
  'app/(tabs)/closet.tsx','app/(tabs)/profile.tsx','app/(tabs)/explore/store.tsx',
  'app/fitcheck/index.tsx','app/fitcheck/tailor.tsx','app/runway/index.tsx',
  'app/subscription/paywall.tsx','src/services/providers/ai/index.ts',
  'src/services/providers/subscription/index.ts','src/services/trends/weeklyTrends.ts',
  'src/state/mediaFlowStore.ts','src/services/sessionLifecycle.ts',
  'assets/icon.png','assets/adaptive-icon.png','package-lock.json','eas.json'
];
criticalFiles.forEach(requireFile);

const cfg = JSON.parse(read('app.json')).expo;
if (cfg.android?.package !== 'com.cgrkrd.aibeauty') issues.push('unexpected Android package id');
if (cfg.ios?.bundleIdentifier !== 'com.cgrkrd.aibeauty') issues.push('unexpected iOS bundle id');
if (!/^\d+\.\d+\.\d+$/.test(cfg.version || '')) issues.push('app version must be semantic x.y.z');
if (!Number.isInteger(cfg.android?.versionCode) || cfg.android.versionCode < 1) issues.push('Android versionCode invalid');
if (!/^\d+$/.test(String(cfg.ios?.buildNumber || ''))) issues.push('iOS buildNumber invalid');

function pngSize(rel) {
  const b = fs.readFileSync(path.join(root, rel));
  if (b.length < 24 || b.toString('ascii',1,4) !== 'PNG') return null;
  return { width:b.readUInt32BE(16), height:b.readUInt32BE(20) };
}
for (const rel of ['assets/icon.png','assets/adaptive-icon.png']) {
  if (!exists(rel)) continue;
  const s = pngSize(rel);
  if (!s) issues.push(`${rel} is not a valid PNG`);
  else if (s.width !== 1024 || s.height !== 1024) issues.push(`${rel} must be 1024x1024, got ${s.width}x${s.height}`);
}

const allCode = [];
function walk(dir) {
  for (const ent of fs.readdirSync(path.join(root,dir), {withFileTypes:true})) {
    const rel = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) allCode.push(rel);
  }
}
for (const d of ['app','src','backend/src']) if (exists(d)) walk(d);
const codeText = allCode.map(p => `\n/* ${p} */\n${read(p)}`).join('\n');

if (/EXPO_PUBLIC_(ANTHROPIC|OPENAI|JWT|REVENUECAT_WEBHOOK|APPLE_PRIVATE|GOOGLE_CLIENT_SECRET)/i.test(codeText)) {
  issues.push('client code appears to reference a server secret as EXPO_PUBLIC_*');
}
if (/router\.(push|replace)\([^\n]*(photoUri|selfieUri|imageUri|returnTo|startSelfie)/i.test(codeText)) {
  issues.push('sensitive media/navigation state appears to be transported in route params');
}
if (/DemoTrendProvider|getTrendProvider\(\)/.test(codeText)) issues.push('legacy demo trend provider is still present');

const aiIndex = read('src/services/providers/ai/index.ts');
if (!/else if \(isDev\).*DemoAIProvider/s.test(aiIndex) || !/throw new Error\("ai_backend_not_configured_for_production"\)/.test(aiIndex)) {
  issues.push('AI provider is not demonstrably fail-closed outside development');
}
const billingIndex = read('src/services/providers/subscription/index.ts');
if (!/else if \(isDev\).*DemoSubscriptionProvider/s.test(billingIndex) || !/throw new Error\("revenuecat_not_configured_for_production"\)/.test(billingIndex)) {
  issues.push('billing provider is not demonstrably fail-closed outside development');
}
const trends = read('src/services/trends/weeklyTrends.ts');
if (!/return null/.test(trends) || !/stale/.test(trends)) issues.push('weekly trend engine must preserve no-data/stale semantics');

const eas = JSON.parse(read('eas.json'));
if (!eas.build?.production?.autoIncrement) issues.push('EAS production autoIncrement is not enabled');
if (eas.build?.production?.developmentClient) issues.push('production profile must not be a development client');

const pkg = JSON.parse(read('package.json'));
for (const script of ['release:source-check','release:env-check']) if (!pkg.scripts?.[script]) issues.push(`missing npm script ${script}`);
if (!exists('.env.example')) issues.push('.env.example missing');

const source = read('scripts/release-readiness.mjs');
if (!source.includes('blocking_source_issues')) warnings.push('source readiness script output contract changed');

console.log('AI Beauty release-candidate static gate');
console.log(`files_scanned=${allCode.length}`);
console.log(`blocking_rc_issues=${issues.length}`);
for (const x of issues) console.error(`BLOCKER: ${x}`);
for (const x of warnings) console.log(`WARN: ${x}`);
process.exitCode = issues.length ? 2 : 0;
