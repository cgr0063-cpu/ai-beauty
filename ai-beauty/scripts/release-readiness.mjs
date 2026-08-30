import fs from 'node:fs';

const cfg = JSON.parse(fs.readFileSync('app.json', 'utf8')).expo;
const envExample = fs.existsSync('.env.example') ? fs.readFileSync('.env.example', 'utf8') : '';
const issues = [];
const warnings = [];

function requireReal(value, label, bad = []) {
  if (!value || bad.some((x) => String(value).includes(x))) issues.push(`${label} is not production-ready`);
}

requireReal(cfg.android?.package, 'Android package', ['com.aibeauty.app', 'REPLACE_']);
requireReal(cfg.ios?.bundleIdentifier, 'iOS bundleIdentifier', ['com.aibeauty.app', 'REPLACE_']);
if (!cfg.icon || !fs.existsSync(cfg.icon.replace(/^\.\//, ''))) issues.push('App icon file is missing');
if (!cfg.android?.adaptiveIcon?.foregroundImage || !fs.existsSync(cfg.android.adaptiveIcon.foregroundImage.replace(/^\.\//, ''))) issues.push('Android adaptive icon foreground is missing');
if (!cfg.android?.versionCode) issues.push('Android versionCode is missing');
if (!cfg.ios?.buildNumber) issues.push('iOS buildNumber is missing');
if (!cfg.version) issues.push('App version is missing');

const easProjectId = process.env.EAS_PROJECT_ID || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
if (!easProjectId) warnings.push('EAS projectId is not set; local/native source is ready, but EAS cloud build requires linking the Expo project first.');

for (const key of [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
  'EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID',
  'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
]) {
  if (!envExample.includes(key)) warnings.push(`${key} is not documented in .env.example`);
}

console.log('AI Beauty release-readiness');
console.log(`blocking_source_issues=${issues.length}`);
for (const i of issues) console.log(`BLOCKER: ${i}`);
for (const w of warnings) console.log(`WARN: ${w}`);
process.exitCode = issues.length ? 2 : 0;
