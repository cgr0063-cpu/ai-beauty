import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const checks=[]; const need=(ok,label)=>checks.push({ok:!!ok,label});
const wardrobe=read('src/state/wardrobeStore.ts');
const closet=read('app/(tabs)/closet.tsx');
const hook=read('src/domain/useTodaysLook.ts');
const api=read('src/services/providers/ai/AIProvider.ts');
const validation=read('backend/src/validation.ts');
const ai=read('backend/src/ai.ts');
const saved=read('src/state/savedLooksStore.ts');
const savedScreen=read('app/(tabs)/saved.tsx');
const storeEngine=read('src/domain/storeModeEngine.ts');
need(wardrobe.includes('brand?: string') && wardrobe.includes('updateItem:'), 'wardrobe metadata supports brand + editing');
need(closet.includes('openEdit') && closet.includes('styleTagsHint') && closet.includes('category.'), 'closet metadata edit UI wired');
need(closet.includes('AI labels are') || closet.includes('metadataTruthNote'), 'AI metadata presented as editable suggestion');
need(api.includes('likedDetails') && hook.includes('lookPreferenceDetail'), 'Today learning uses bounded look detail signals');
need(validation.includes('likedDetails') && validation.includes('bannedDetails'), 'backend validates richer preference signals');
need(ai.includes('never copy an old look verbatim') && ai.includes('never overfit'), 'AI learning prompt prevents memorization/overfit');
need(saved.includes('feedback: LookFeedback | null') && savedScreen.includes('? null : "love"'), 'saved feedback can be undone/corrected');
need(storeEngine.includes('signal.details'), 'Store Mode also uses corrected saved-look detail signals');
need(hook.includes('brand: item.brand ?? null') && validation.includes('brand: z.union'), 'user-corrected brand reaches Today request safely');
for (const lang of ['en','tr','ru']) {
  const d=JSON.parse(read(`src/i18n/locales/${lang}.json`));
  need(d.closet?.editTitle && d.closet?.brand && d.closet?.category?.top, `${lang} wardrobe edit copy present`);
}
const failures=checks.filter(c=>!c.ok);
for (const c of checks) console.log(`${c.ok?'PASS':'FAIL'} ${c.label}`);
console.log(`blocking_p22_issues=${failures.length}`);
process.exit(failures.length?1:0);
