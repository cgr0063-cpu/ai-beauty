# AI Beauty — Store Submission Privacy Checklist (P19)

This checklist is a release-operations document, not a substitute for legal review. Complete it against the exact production providers and store-account answers before submission.

## Photo and camera data
- Selfie, Fit Check and closet photos are stored in the app-owned device directory when persistence is needed.
- AI photo upload is opt-in. If `photoAiConsentAccepted` is false, Today's Look does not attach the saved selfie to remote AI requests.
- Fit Check and closet analysis ask for AI-photo consent before analysis.
- "Delete my photos" deletes the physical app-owned selfie/full-body/wardrobe photo files and removes their references.
- Replacing a selfie or full-body photo removes the previous app-owned photo; temporary Runway video is kept in cache and deleted on retake/unmount.
- Photos explicitly saved to the user's system photo library are outside the app sandbox; explain in privacy copy that the user controls/deletes those through the device Photos app.

## Account data access and deletion
- Profile > Export produces local profile/settings/today-context/Saved Looks/feedback/wardrobe metadata and the provider-account export.
- Remote `/v1/me/export` returns account and entitlement metadata only; it does not return password hashes or Google/Apple provider subject identifiers.
- Remote `/v1/me` deletion removes users, entitlements and RevenueCat event rows in one DB transaction.
- Local-account deletion removes the local credential record. Current account snapshot and local reminders are removed during session teardown.

## Notifications
- Daily look, 3-day inactivity, weekly trend and saved-look reuse reminders are separate opt-in switches.
- Permanent permission denial offers a route to OS Settings.
- Sign-out/account deletion cancels AI Beauty local reminders.
- Notification deep links are allow-listed to Home, Saved Looks and Store Mode only.

## Apple App Privacy / Google Play Data Safety answers to verify
Before filling store forms, confirm the exact production AI, analytics, crash, billing and hosting vendors. Do not claim "data not collected" merely because data is transient. Record for every transmitted data type: purpose, whether linked to identity, retention, encryption in transit, deletion path, and whether it is used for tracking. RevenueCat purchase/entitlement data must be disclosed according to the final SDK/provider behavior.

## Submission evidence
Capture screenshots/video of: photo-consent prompt, notification settings, OS-settings fallback, Export My Data result, Delete My Photos behavior, Delete Account confirmation/result, subscription restore/manage flow, Fit Check low-confidence retake, Store Mode trend source/date, and Runway permission handling.
