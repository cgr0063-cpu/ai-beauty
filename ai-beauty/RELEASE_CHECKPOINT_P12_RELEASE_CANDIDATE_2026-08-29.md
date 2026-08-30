# P12 — Release Candidate Static Gate

Completed in this checkpoint:
- Removed the unused legacy `DemoTrendProvider` source so a fake trend implementation cannot accidentally be reintroduced through the old interface.
- Added `scripts/release-candidate-check.mjs`, a dependency-free static RC gate checking critical routes/files, identifiers/versioning, 1024x1024 PNG assets, secret leakage patterns, route-param media leakage patterns, AI/billing production fail-closed behavior, weekly trend no-data/stale semantics, and EAS production profile basics.
- Added `npm run release:rc-check` and `npm run release:production-check`.
- Added `DEVICE_QA_RELEASE_CANDIDATE.md`, separating source readiness from actual physical-device verification.

Important boundary:
- Static gates do not prove native compilation, OAuth, store billing, push delivery, camera behavior or AI network behavior. Those require real owner configuration and signed device builds.
