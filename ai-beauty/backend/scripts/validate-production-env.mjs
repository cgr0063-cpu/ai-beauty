const env = process.env;
const errors = [];
const warnings = [];
const required = (key, test, hint) => {
  const value = (env[key] || '').trim();
  if (!value) errors.push(`${key} is missing${hint ? ` — ${hint}` : ''}`);
  else if (test && !test(value)) errors.push(`${key} is invalid${hint ? ` — ${hint}` : ''}`);
  return value;
};

if ((env.NODE_ENV || '').trim() !== 'production') errors.push('NODE_ENV must be production');
required('DB_DRIVER', v => v === 'postgres', 'production requires postgres');
required('DATABASE_URL', v => /^postgres(?:ql)?:\/\//i.test(v), 'use a managed PostgreSQL connection string');
required('ANTHROPIC_API_KEY', v => v.length >= 20, 'server-side AI key required');
required('JWT_SECRET', v => v.length >= 32, 'use a random secret of at least 32 characters');
required('GOOGLE_IOS_CLIENT_ID', v => v.endsWith('.apps.googleusercontent.com'));
required('GOOGLE_ANDROID_CLIENT_ID', v => v.endsWith('.apps.googleusercontent.com'));
required('APPLE_CLIENT_ID', v => /^[A-Za-z0-9.-]+$/.test(v), 'must match the Apple bundle/service identifier used for Sign in with Apple');
required('REVENUECAT_WEBHOOK_SECRET', v => v.length >= 24, 'use a long random bearer secret');
required('TREND_SOURCE_URL', v => /^https:\/\//i.test(v), 'configure a verified HTTPS weekly fashion/beauty trend JSON source');
const origins = (env.CORS_ALLOWED_ORIGINS || '').trim();
if (origins && !origins.split(',').every(x => /^https:\/\//i.test(x.trim()))) {
  errors.push('CORS_ALLOWED_ORIGINS is invalid — use comma-separated HTTPS origins only');
}
if (!origins) warnings.push('CORS_ALLOWED_ORIGINS is empty. Native mobile requests can still work, but add explicit HTTPS origins before exposing a web/admin client.');

console.log('AI Beauty backend production environment');
for (const w of warnings) console.log(`WARN: ${w}`);
for (const e of errors) console.error(`BLOCKER: ${e}`);
console.log(`blocking_backend_env_issues=${errors.length}`);
process.exitCode = errors.length ? 2 : 0;
