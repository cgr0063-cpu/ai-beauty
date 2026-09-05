import fs from "node:fs";

const read = (p) => fs.readFileSync(p, "utf8");
const checks = [];
const requireText = (file, text, message) => checks.push({ ok: read(file).includes(text), message });

requireText("src/services/privacy/photoConsent.ts", "photoAiConsentAccepted", "AI photo processing requires explicit persisted consent");
requireText("src/domain/useTodaysLook.ts", "settings.photoAiConsentAccepted ? user.selfieUri : null", "Today's Look must not upload selfie without consent");
requireText("src/services/storage/photoLibrary.ts", "deletePersistedPhotos", "Persisted photo deletion helper missing");
requireText("app/(tabs)/profile.tsx", "deletePersistedPhotos(refs)", "Delete Photos / account cleanup must delete physical app-owned files");
requireText("src/services/providers/auth/RemoteAuthProvider.ts", "/v1/me/export", "Remote account export endpoint not wired");
requireText("backend/src/server.ts", "app.get(\"/v1/me/export\"", "Backend account export endpoint missing");
requireText("backend/src/server.ts", "SELECT id, email, name, provider, created_at", "Export must avoid password hashes/provider subject IDs");
requireText("src/services/notifications.ts", "refreshInactivityReminder", "Inactivity reminder missing");
requireText("src/services/notifications.ts", "scheduleWeeklyTrendReminder", "Weekly trend reminder missing");
requireText("src/services/notifications.ts", "scheduleSavedLookReminder", "Saved-look reuse reminder missing");
requireText("src/services/sessionLifecycle.ts", "cancelAllBeautyReminders", "Sign-out must cancel account-scoped reminders");
requireText("app/runway/index.tsx", "FileSystem.cacheDirectory", "Runway temporary video must not live indefinitely in documents storage");

const failed = checks.filter((c) => !c.ok);
console.log("AI Beauty P19 privacy/notifications gate");
for (const c of failed) console.error(`BLOCKER: ${c.message}`);
console.log(`blocking_p19_privacy_notification_issues=${failed.length}`);
process.exit(failed.length ? 1 : 0);
