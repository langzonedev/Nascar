# Acceptance and verification

25 November 2026 — version 1.2.0, competitive field and banking.

## Goal and authority

Replace passive traffic with opponents at matching pace, make drafting useful for overtaking, display race position, allow defending and losing first place, and bank the oval corners. Repository: langzonedev/Nascar, main. Existing explicit authority permits direct commits and GitHub Pages publication. No binary build required.

## Behaviour

- Twelve-car rolling start, player in P12; eleven persistent, numbered rivals.
- Position uses unwrapped total distance, including regained places and lap differences. Physical proximity wraps around the oval separately.
- Matched engine performance within one percent of baseline, small racing-line differences, gradually increasing automatic pace.
- Player charges a boost by following another car for approximately 1.65 seconds. Boost automatically fires for 2.8 seconds; steer into a clear lane to pass.
- Rivals also draft and boost, including behind the player. They select a clear adjacent lane to pass, with braking when the current line is blocked. No rank-based speed changes or teleporting.
- P1 accumulates lead time and additional score. The HUD shows position, next-car/chaser gap and nearby rivals. Results include best position and lead time.
- Two smooth left bends per lap, with raised outer edge, projected lane heights, aligned car lean, mild outward drift and slightly quicker inside line. This is arcade geometry/handling, not a tyre or suspension simulation.
- Wall pressure scrubs speed. Full-screen two-direction input remains unchanged.

## Automated checks

JavaScript syntax checks and twenty deterministic Node tests:

- Repeating, continuous oval curvature and banking.
- Draft alignment/safe range, collision separation, charge decay and boost lockout.
- Persistent field, unique opponent identities and matched engine pace.
- Position changes, regained places, unwrapped ranking and physical lap wrapping.
- Rival drafting produces boost; blocked rivals brake without rear-ending the player.
- A boosted rival can pull out and pass the player.
- The full field seeks slipstreams and generates its own boosts over a 30-second simulation.
- Matched pace preserves a gap; boost provides an overtaking advantage.
- Both screen halves steer; release stops lateral steering velocity.
- Pause freezes progress; resume continues the same run.
- Contact preserves the run, cancels boost, slows the car and recovers automatically.
- Repeated contact triggers a temporary spin and recovery; retry clears heat/spin state.
- A single impact, including boost-speed contact, never causes an immediate spin.
- Cooldowns suppress repeated frame penalties while solid separation prevents ghosting through a rival.
- Heat decays during clean driving; recovery clears the slowdown.
- Ending a paused run closes the pause panel.
- In a controlled leader fixture, draft charging and steering out produces P1, an overtake and lead time.

## Browser review

Desktop title, banked track rendering and race/result screens reviewed. Portrait 390 × 844 and landscape 844 × 390 reviewed through responsive browser frames. Position HUD and slipstream meter confirmed in a live portrait run. The waiting-worker update prompt was accepted and returned the app to the updated menu.

## Limits

Automated checks establish mechanics and controlled race scenarios, not human skill balance or enjoyment. No claim of an independently playtested full-field win. Physical phone touch, installation, offline cold starts, speaker output and sustained device frame pacing still need device confirmation. Banking is stylised Canvas projection, not a full 3D physics engine.

## Release and rollback

GitHub Actions runs syntax/tests before deploying main. Worker cache version is `redline-v1.2.0`. Revert the release commit and redeploy for rollback; increment worker cache version on subsequent changed releases.

The live check exposed mixed cached assets after publication. Script, mechanics import and stylesheet URLs now carry a release version, and the worker precaches those exact URLs.

## Contact behaviour in 1.2.0

Bump: 0.85-second settling period, boost/charge cancelled, immediate speed loss. Heat rises by 0.34–0.58 based on closing speed, then cools at 0.12/second. Hits register at most once per 0.65 seconds, including when multiple cars overlap. Threshold 1 triggers a 1.6-second spin at 42% target pace and 35% steering response. Spin recovery protection lasts 2.6 seconds from spin onset; physical bumper separation remains active throughout. A single heavy hit stays below the spin threshold. The run ends only through Pause → End run.
