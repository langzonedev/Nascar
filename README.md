# Redline Oval

**[Play Redline Oval](https://langzonedev.github.io/Nascar/)** · A Lang Systems original

A sunset stock-car racer built for quick, satisfying runs on a phone or desktop. Accelerate automatically, weave through a moving pack, and use a rival's slipstream to launch past them. Original red number 27 racer, warm cartoon styling, rounded oval circuit, grandstands and a never-ending chase.

## Controls

| Action | Phone / tablet / mouse | Keyboard |
| --- | --- | --- |
| Steer left | Hold the left half of the screen | Left arrow / A |
| Steer right | Hold the right half of the screen | Right arrow / D |
| Hold your line | Release | Release |
| Pause / resume | Pause / Keep racing | P / Escape |

Acceleration is automatic and pace increases over time. Follow closely behind a car to charge the yellow slipstream meter. A full charge automatically triggers a 2.8-second slingshot boost: move out and overtake! Fast rivals are the best drafting targets. Slow cars close quickly, so pass them early. Traffic changes lanes only at a visible distance.

## The chase

- Three traffic paces, five traffic lanes and smooth free steering.
- 100 points per overtake, an extra 75 for a close call, 150 for a boost, plus distance points.
- Gradually increasing speed and traffic frequency, with a gentle opening.
- Lap progress, live speed, slipstream feedback, boost trails and optional engine audio.
- Crash debris plays for three seconds before results; quick retry and local personal best.
- Pauses when switching tabs or losing focus; reduced-motion support.
- Installable PWA with phone icons, offline play after the first load, and an update prompt only when a new worker is waiting.
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
