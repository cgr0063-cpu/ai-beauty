# Signed-device QA automation

## Android
After installing the signed preview/production APK on exactly one authorized Android device:

```bash
npm run qa:android-device
```

The smoke gate verifies the release package is installed, launches it, confirms the process stays alive, scans recent logcat for fatal crashes, and verifies CAMERA/RECORD_AUDIO are present in the installed manifest.

This is a smoke test only. The manual `DEVICE_QA_RELEASE_CANDIDATE.md` checklist is still required for camera UX, Fit Check quality, Saved Looks, account switching, notification permission behavior, RevenueCat purchase/restore, Store Mode, and Runway video.

## iOS
The iOS signed-device pass requires a macOS/Xcode/TestFlight environment. Do not mark iOS device QA complete from source-only checks.
