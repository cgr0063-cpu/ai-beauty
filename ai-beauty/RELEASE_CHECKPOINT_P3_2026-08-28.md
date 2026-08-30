# AI Beauty P3 checkpoint — onboarding, hydration, language, weather, generation

Applied in this checkpoint:
- Added language selection before personalization and persisted i18n language sync.
- Added optional name/age basics step and style-interest step to onboarding.
- Interrupted onboarding resumes from the beginning of the personalization sequence instead of skipping to modules.
- Root splash/navigation now waits for all persisted Zustand stores to hydrate.
- Automatic weather no longer disguises a permission/network failure as live weather; seasonal demo remains only for manual/offline mode.
- Today's Look uses local calendar day keys and resets again when app returns to foreground.
- Fixed first-generation stale-weather race by passing the just-fetched reading directly into the AI input.
- Added request sequencing so stale concurrent AI responses cannot overwrite newer results.
- Home generation is focus-scoped to prevent hidden-tab AI calls.
- Removed the fixed sun emoji from evening/night greetings.

Still not final: release SDK/build migration, photo normalization/EXIF, notifications, saved-look management UI, runway/video, store mode, full subscription UX and final dependency-backed typecheck/build remain.
