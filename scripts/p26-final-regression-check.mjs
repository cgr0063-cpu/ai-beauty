import fs from 'node:fs';
const checks = [
  ['app/fitcheck/index.tsx', ['analysisFailed', 'fitCheck.analysisError', 'common.retry', 'accessibilityRole="alert"']],
  ['app/subscription/paywall.tsx', ['accessibilityRole="progressbar"', 'accessibilityLiveRegion="polite"']],
  ['app/runway/index.tsx', ['ActivityIndicator', 'accessibilityRole="progressbar"', 'accessibilityRole="alert"']],
  ['app/(tabs)/explore/store.tsx', ['keyboardDismissMode="interactive"', 'accessibilityRole="alert"']],
  ['src/i18n/locales/en.json', ['"analysisError"']],
  ['src/i18n/locales/tr.json', ['"analysisError"']],
  ['src/i18n/locales/ru.json', ['"analysisError"']],
];
let blockers = 0;
for (const [file, needles] of checks) {
  const text = fs.readFileSync(file, 'utf8');
  for (const needle of needles) if (!text.includes(needle)) { console.error(`BLOCKER ${file}: missing ${needle}`); blockers++; }
}
console.log('AI Beauty P26 final regression/polish gate');
console.log(`blocking_p26_issues=${blockers}`);
process.exit(blockers ? 1 : 0);
