# Redline Oval

**[Play Redline Oval](https://langzonedev.github.io/Nascar/)** · A Lang Systems original

A sunset stock-car battle built for a phone or desktop. Start **12th in a persistent 12-car field**, use slipstream boosts to earn positions, then defend the lead against opponents who can draft and boost too. Original red number 27 racer, banked left turns, warm cartoon styling and an endless oval chase.

## Controls

| Action | Phone / tablet / mouse | Keyboard |
| --- | --- | --- |
| Steer left | Hold the left half of the screen | Left arrow / A |
| Steer right | Hold the right half of the screen | Right arrow / D |
| Hold your line | Release | Release |
| Pause / resume | Pause / Keep racing | P / Escape |

Acceleration is automatic, with a rolling start at race pace. Opponents have closely matched engines, so driving alongside them offers little advantage. Follow closely until the yellow meter fills, then **pull out when the automatic 2.8-second slingshot fires**. Plan a clear passing lane before the boost arrives.

On corners, the outer edge rises, the cars lean with the banking, and your car drifts gently outward. Short steering corrections hold your line. The inside line is slightly faster; pushing against the edge scrubs speed.

## Fight for the lead

- A fixed field of eleven numbered rivals plus the player. No spawning or deleting cars to manufacture position.
- Live **position / 12**, gap to the next opponent, lap progress and nearby-car warnings.
- Rivals accelerate at roughly your unboosted pace, draft one another and you, change lanes to pass, and brake behind an occupied lane.
- Opponent engines and boosts are independent of race position: no teleporting or rank-based catch-up speeds.
- Once first, break a chaser's slipstream by changing lines and defend your position. Opponents can retake the lead.
- 100 points per overtake, 150 per boost, distance points and 30 points per second leading.
- Results show overtakes, boosts, distance, best position and cumulative time in the lead.
- Smooth oval curvature, raised banking on both corners, road-aligned car lean and gentle camera roll. Reduced-motion mode removes camera roll and speed streaks.
- Crash debris plays for three seconds before results; quick retry and local personal best.
- Pauses on tab/window focus loss; optional synthesized audio, initially muted.
- Installable PWA with phone icons, offline play after the first load, and an update prompt only when a new version is waiting.
- No accounts, tracking, external assets, paid services or runtime dependencies.

This is an original stock-car arcade game inspired by animated racing films. It is not affiliated with Disney, Pixar or NASCAR, and uses no licensed characters or artwork.

## Development

No dependency installation or build is required. Serve the repository over HTTP:

```sh
python3 -m http.server 8080
# Open http://localhost:8080
npm run check
npm test
```

The game uses Canvas 2D with perspective road projection, procedural car art, a separate testable mechanics module and Web Audio. Device scores are stored locally. Node.js 22+ is used for automated checks.

## Deployment

Pushes to `main` run checks and deploy the static game through `.github/workflows/pages.yml`. GitHub Pages uses GitHub Actions as its source. Live URL: **https://langzonedev.github.io/Nascar/**.

If Pages has not been enabled and workflow auto-enablement is denied, select GitHub Actions under Settings → Pages, then rerun the deployment. Increase the cache version in `sw.js` when releasing changed assets. An existing run is paused before accepting an update.

See [verification and acceptance](docs/VERIFICATION.md) for coverage and remaining device checks.
