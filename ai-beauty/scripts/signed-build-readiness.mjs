import fs from 'node:fs';

const errors = [];
const warnings = [];
const env = process.env;
const app = JSON.parse(fs.readFileSync('app.json','utf8')).expo;
const eas = JSON.parse(fs.readFileSync('eas.json','utf8'));
const platform = (env.BUILD_PLATFORM || 'all').trim().toLowerCase();

if (!['android','ios','all'].includes(platform)) errors.push('BUILD_PLATFORM must be android, ios, or all');
const wantsAndroid = platform === 'android' || platform === 'all';
const wantsIos = platform === 'ios' || platform === 'all';

const uuid = (env.EAS_PROJECT_ID || '').trim();
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid)) errors.push('EAS_PROJECT_ID must be the real Expo project UUID');
if (!/^com\.[a-z0-9_.-]+$/i.test(app.android?.package || '')) errors.push('Android package id is invalid');
if (!/^com\.[a-z0-9_.-]+$/i.test(app.ios?.bundleIdentifier || '')) errors.push('iOS bundleIdentifier is invalid');
if (!eas.build?.preview || eas.build.preview.distribution !== 'internal') errors.push('preview build must use internal distribution');
if (!eas.build?.production?.autoIncrement) errors.push('production build must autoIncrement');
if (!(env.EXPO_PUBLIC_API_BASE_URL || '').trim().startsWith('https://')) errors.push('EXPO_PUBLIC_API_BASE_URL must be HTTPS');

if (wantsAndroid) {
  if (!/^goog_[A-Za-z0-9]+$/.test((env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '').trim())) errors.push('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY is missing/invalid for Android signed build');
  if (!(env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '').trim().endsWith('.apps.googleusercontent.com')) errors.push('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID is missing/invalid for Android signed build');
}
if (wantsIos) {
  if (!/^appl_[A-Za-z0-9]+$/.test((env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '').trim())) errors.push('EXPO_PUBLIC_REVENUECAT_IOS_KEY is missing/invalid for iOS signed build');
  if (!(env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '').trim().endsWith('.apps.googleusercontent.com')) errors.push('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID is missing/invalid for iOS signed build');
}
if (platform !== 'all') warnings.push(`Only ${platform} owner credentials were required in this run; run again with BUILD_PLATFORM=all before dual-store release.`);

console.log(`AI Beauty signed-build readiness (${platform})`);
for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_signed_build_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
