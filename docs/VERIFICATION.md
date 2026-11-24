# Acceptance and verification

25 November 2026 — first release.

## Goal and authority

Build a fun endless oval stock-car racer with two-half steering, automatic acceleration, mixed traffic and automatic slipstream boosts. Repository: langzonedev/Nascar, main. Direct main publication was explicitly requested. No binary build required.

## Checks

- JavaScript syntax checks for game, mechanics and service worker.
- Six deterministic mechanics tests: repeating oval geometry; safe/aligned drafting; collision and adjacent lane separation; fast-rival boost timing; charge decay and boost lockout; ordered traffic paces.
- Four flow tests: both steering directions and release; pause/resume; three-second crash and retry; closing pause on end run.
- Desktop browser review of title screen and live race.
- Portrait 390 × 844 and landscape 844 × 390 responsive review using browser frames.
- Crash flow, pause/resume, result screen and retry reviewed through browser UI.
- Static asset completeness checked against service-worker precache and workflow packaging.

## Design and engineering decisions

- Original red number 27 racer, procedural sunset art and no licensed assets.
- Automatic boost keeps the requested two-direction control scheme.
- Fast rivals allow enough following time for a full charge; slower traffic is overtaken early.
- Gradual speed increase, limited nearby traffic and distant lane changes provide readable traffic.
- Player steering limits overlap the outer traffic lanes to prevent an invulnerable edge route.
- Three-second crash aftermath carries forward the Jetship interaction preference.
- Oval repeats over approximately 2.78 km. The view follows the player's lane on bends.

## Limits

Browser frames validate responsive layout, not physical phone touch, vibration or speaker output. Installation, an offline cold start, service-worker version replacement and real-device frame pacing need device confirmation. Audio is optional synthesized engine/boost/crash audio, muted initially. Difficulty and fun remain subject to player feedback; no claim of external playtesting.

## Rollback

Revert the release commit on main to redeploy a previous version. Change the worker cache version when releasing another asset set.
