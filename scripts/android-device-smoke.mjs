import { execFileSync } from 'node:child_process';

const pkg = process.env.ANDROID_PACKAGE || 'com.cgrkrd.aibeauty';
const fail = msg => { console.error(`BLOCKER: ${msg}`); process.exitCode = 2; };
const adb = (...args) => execFileSync('adb', args, { encoding:'utf8', stdio:['ignore','pipe','pipe'] }).trim();

console.log(`AI Beauty Android signed-device smoke — ${pkg}`);
try {
  const devices = adb('devices').split('\n').slice(1).filter(x => /\tdevice$/.test(x));
  if (devices.length !== 1) {
    fail(`expected exactly one authorized Android device, found ${devices.length}`);
  } else {
    const installed = adb('shell','pm','path',pkg);
    if (!installed.startsWith('package:')) fail('release package is not installed');
    adb('logcat','-c');
    adb('shell','monkey','-p',pkg,'-c','android.intent.category.LAUNCHER','1');
    await new Promise(r => setTimeout(r, 3000));
    const pid = adb('shell','pidof',pkg);
    if (!pid) fail('app did not stay running after launch');
    const crash = adb('logcat','-d','-t','300');
    if (/FATAL EXCEPTION|AndroidRuntime:.*FATAL|Process: com\.cgrkrd\.aibeauty.*has died/i.test(crash)) fail('fatal crash detected in recent logcat');
    const perms = adb('shell','dumpsys','package',pkg);
    for (const p of ['android.permission.CAMERA','android.permission.RECORD_AUDIO']) {
      if (!perms.includes(p)) fail(`manifest permission missing: ${p}`);
    }
    console.log('android_device_smoke_passed=true');
  }
} catch (error) {
  fail(`adb smoke could not run: ${error?.message || error}`);
}
