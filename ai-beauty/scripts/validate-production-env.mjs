const env = process.env;
const errors = [];
const warnings = [];

const required = (key, test, hint) => {
  const value = (env[key] || '').trim();
  if (!value) errors.push(`${key} is missing${hint ? ` — ${hint}` : ''}`);
  else if (test && !test(value)) errors.push(`${key} has an invalid format${hint ? ` — ${hint}` : ''}`);
  return value;
};

const api = required('EXPO_PUBLIC_API_BASE_URL', v => /^https:\/\//i.test(v), 'production API must use HTTPS');
required('EAS_PROJECT_ID', v => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v), 'use the real Expo/EAS project UUID');
required('EXPO_PUBLIC_REVENUECAT_IOS_KEY', v => /^appl_[A-Za-z0-9]+$/.test(v), 'use the RevenueCat public iOS SDK key');
required('EXPO_PUBLIC_REVENUECAT_ANDROID_KEY', v => /^goog_[A-Za-z0-9]+$/.test(v), 'use the RevenueCat public Android SDK key');
required('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', v => v.endsWith('.apps.googleusercontent.com'), 'use the iOS OAuth client id');
required('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', v => v.endsWith('.apps.googleusercontent.com'), 'use the Android OAuth client id');

const trendFeed = (env.EXPO_PUBLIC_TREND_FEED_URL || '').trim();
if (trendFeed && !/^https:\/\//i.test(trendFeed)) errors.push('EXPO_PUBLIC_TREND_FEED_URL must use HTTPS when provided');
if (!trendFeed) warnings.push('EXPO_PUBLIC_TREND_FEED_URL not set; mobile will use the authenticated production backend trend proxy.');

if (api && /localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(api)) errors.push('EXPO_PUBLIC_API_BASE_URL points to a local development host');

console.log('AI Beauty mobile production environment');
for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_env_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
