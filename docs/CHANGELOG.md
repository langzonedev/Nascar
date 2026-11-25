# Release notes

## 1.3.0 — 25 November 2026

- Add a physical checkered start/finish stripe and overhead Sunset Speedway gantry.
- Add four numbered turn boards and a back-straight landmark to make the circuit recognisable.
- Track current, last and personal-best lap times; announce each completed circuit, preserving best lap on this device.
- Add an optional racing line with wide entry, inside apex and wide exit. LINE toggles it.
- Increase outward corner pull with speed and add meaningful corner-line speed loss. Rivals use the same line-based speed model and seek a clear cornering line.
- Verify that a driver who ignores the line can lose P1 without rubber-banding or fatal contact.

## 1.2.1 — 25 November 2026

- Draw asphalt as one continuous surface, removing horizontal segment seams and alternating road bands. Keep lane markings and kerb stripes.
- Move all driving messages into a compact HUD area above the road, with a left-side layout on short landscape screens.

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
