import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");
const issues=[];
const primitives=read("src/design-system/components/Primitives.tsx");
const button=read("src/design-system/components/Button.tsx");
const enhancer=read("app/camera/enhance.tsx");
const closet=read("app/(tabs)/closet.tsx");
for (const p of ["app/(auth)/sign-in.tsx","app/(auth)/sign-up.tsx"]) {
  const s=read(p);
  if (!s.includes('keyboardDismissMode="interactive"') || !s.includes('accessibilityRole="alert"')) issues.push(`${p}: keyboard/error accessibility incomplete`);
}
if (primitives.includes('accessibilityLabel="Go back"') || primitives.includes('?? "Skip"')) issues.push("hardcoded header accessibility copy remains");
if (!button.includes('busy: !!loading') || button.includes('adjustsFontSizeToFit')) issues.push("Button loading/large-text accessibility incomplete");
if (!enhancer.includes("ScrollView") || !enhancer.includes("screenScroll")) issues.push("enhancer is not small-screen scroll safe");
if (!closet.includes("KeyboardAvoidingView") || !closet.includes('keyboardDismissMode="interactive"')) issues.push("closet edit sheet is not keyboard safe");
console.log("AI Beauty P25 accessibility/polish gate");
console.log(`blocking_p25_issues=${issues.length}`);
for (const x of issues) console.log(`BLOCKER: ${x}`);
process.exitCode=issues.length?1:0;
