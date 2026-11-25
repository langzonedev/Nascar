# Release notes

## 1.2.0 — 25 November 2026

- Replace instant contact explosions with recoverable bumps and short wobble/slowdown.
- Cancel boost on impact; repeated or harder hits build heat and cause a 1.6-second spin.
- Add clean-driving heat decay, effect cooldowns and recovery protection, with solid collision separation throughout.
- Add contact feedback and result spin count. Contact never ends a run; Pause → End run opens results.
- Reset penalties on retry and preserve them while paused; suppress wobble/spin rotation with reduced motion.

## 1.1.1 — 25 November 2026

- Version script, mechanics and stylesheet URLs to prevent cached first-release logic from loading with the new race HUD.

## 1.1.0 — 25 November 2026

- Replace slower disposable traffic with a persistent 12-car race at closely matched pace.
- Add live position, timing gaps, opponent map dots and nearby-car warnings.
- Give rivals their own drafting boosts, passing decisions and following brakes.
- Track best position and time leading; award additional score for holding P1.
- Add smooth left turns, rising outer banking, car lean, camera roll and outward drift.
- Make the inside line slightly quicker and wall pressure cost speed.
- Preserve two-half controls, automatic acceleration/boosts, crash aftermath, pause, retry and PWA updates.
- Separate build and Pages publication, with unique artifact names, so a failed publication can retry without duplicate uploads.
