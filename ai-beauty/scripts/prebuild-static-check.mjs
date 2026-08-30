import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const issues = [];
const warnings = [];
const read = p => fs.readFileSync(path.join(root,p),'utf8');
const json = p => JSON.parse(read(p));
const exists = p => fs.existsSync(path.join(root,p));

const pkg = json('package.json');
const lock = json('package-lock.json');
const app = json('app.json').expo;
const lockRoot = lock.packages?.[''] ?? {};

if (lock.lockfileVersion !== 3) warnings.push(`package-lock lockfileVersion=${lock.lockfileVersion}; expected npm modern lockfile v3`);
for (const section of ['dependencies','devDependencies']) {
  for (const [name, version] of Object.entries(pkg[section] ?? {})) {
    if ((lockRoot[section] ?? {})[name] !== version) issues.push(`package-lock root mismatch for ${name}`);
  }
}

if (pkg.main !== 'expo-router/entry') issues.push('package.json main must be expo-router/entry');
if (!String(pkg.dependencies?.expo ?? '').startsWith('~51.')) warnings.push('Expo SDK is not 51.x; re-run Expo compatibility review before release');
if (pkg.dependencies?.['react-native'] !== '0.74.1') warnings.push(`React Native version changed to ${pkg.dependencies?.['react-native']}; verify against the selected Expo SDK`);

const plugins = app.plugins ?? [];
const pluginNames = plugins.map(x => Array.isArray(x) ? x[0] : x);
for (const required of ['expo-router','expo-camera','expo-location','expo-secure-store','expo-apple-authentication','expo-notifications']) {
  if (!pluginNames.includes(required)) issues.push(`missing Expo plugin: ${required}`);
}
if (!app.ios?.usesAppleSignIn) issues.push('iOS usesAppleSignIn must be enabled');
for (const key of ['NSCameraUsageDescription','NSPhotoLibraryUsageDescription','NSPhotoLibraryAddUsageDescription','NSLocationWhenInUseUsageDescription','NSMicrophoneUsageDescription']) {
  if (!app.ios?.infoPlist?.[key]) issues.push(`missing iOS privacy string: ${key}`);
}
const androidPerms = new Set(app.android?.permissions ?? []);
for (const legacy of ['READ_EXTERNAL_STORAGE','WRITE_EXTERNAL_STORAGE']) if (androidPerms.has(legacy)) issues.push(`legacy Android permission still present: ${legacy}`);
for (const needed of ['CAMERA','RECORD_AUDIO','ACCESS_COARSE_LOCATION','POST_NOTIFICATIONS']) if (!androidPerms.has(needed)) issues.push(`expected Android permission missing: ${needed}`);

if (!exists('app.config.js') || !/EAS_PROJECT_ID/.test(read('app.config.js'))) issues.push('app.config.js must inject real EAS projectId from environment');
if (/00000000-0000-0000-0000-000000000000|REPLACE_/i.test(read('app.json'))) issues.push('placeholder id remains in app.json');

const weather = read('src/services/providers/weather/OpenMeteoWeatherProvider.ts');
if (/return\s+demo\.getCurrentWeather/.test(weather)) issues.push('automatic weather still silently falls back to a demo reading');
if (!/throw new Error\("weather_coordinates_required"\)/.test(weather)) issues.push('automatic weather must fail closed without coordinates');
const backend = read('backend/src/server.ts');
if (/temperature_2m\s*\?\?\s*20/.test(backend)) issues.push('backend weather still fabricates a default current temperature');
if (!/invalid_coordinates/.test(backend)) issues.push('backend weather endpoint does not validate coordinates');

const eas = json('eas.json');
if (eas.build?.preview?.developmentClient) issues.push('preview build must not be a development client');
if (eas.build?.production?.distribution === 'internal') issues.push('production distribution must not be internal');
if (!eas.build?.production?.autoIncrement) issues.push('production build must auto-increment store build numbers');

const sourceDirs = ['app','src','backend/src'];
let httpHits = [];
function walk(dir) {
  if (!exists(dir)) return;
  for (const ent of fs.readdirSync(path.join(root,dir), {withFileTypes:true})) {
    const rel = path.join(dir,ent.name);
    if (ent.isDirectory()) walk(rel);
    else if (/\.(ts|tsx|js|mjs)$/.test(ent.name)) {
      const text = read(rel);
      if (/http:\/\/(?!localhost|127\.0\.0\.1)/i.test(text)) httpHits.push(rel);
    }
  }
}
sourceDirs.forEach(walk);
if (httpHits.length) issues.push(`non-HTTPS production-capable URL found in: ${[...new Set(httpHits)].join(', ')}`);

console.log('AI Beauty pre-build static gate');
console.log(`blocking_prebuild_issues=${issues.length}`);
for (const x of issues) console.error(`BLOCKER: ${x}`);
for (const x of warnings) console.log(`WARN: ${x}`);
process.exitCode = issues.length ? 2 : 0;
