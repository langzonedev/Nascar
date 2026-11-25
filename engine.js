export const TRACK = 240000;
export const FIELD_SIZE = 12;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = v => {const t = clamp(v, 0, 1); return t * t * (3 - 2 * t);};
export function curveAt(z) {
  const section = (((z % TRACK) + TRACK) % TRACK) / TRACK * 2 % 1;
  return -1.1 * Math.min(smooth((section - .12) / .16), smooth((.88 - section) / .16)) || 0;
}
export const bankAt = z => -curveAt(z) / 1.1 * .34;
export const racePace = seconds => Math.min(7600, 6000 + seconds * 7);
export const trackPhase = z => ((z % TRACK) + TRACK) % TRACK / TRACK;
export function racingLineAt(z) {
  const section = trackPhase(z) * 2 % 1;
  const apex = smooth((section - .12) / .24) * (1 - smooth((section - .60) / .28));
  return .28 - apex * .76;
}
export function linePace(pace, lane, z) {
  const corner = bankAt(z) / .34, error = Math.abs(lane - racingLineAt(z));
  return pace * (1 - corner * (.14 + Math.min(1.4, error) ** 1.4 * .18));
}
export const cornerPull = (z, speed, pace) => bankAt(z) / .34 * .22 * (speed / (pace * .9)) ** 2 || 0;
export function trackSection(z) {
  const phase = trackPhase(z), section = phase * 2 % 1;
  if (section < .12 || section > .88) return phase > .25 && phase < .75 ? 'BACK STRAIGHT' : 'HOME STRAIGHT';
  return 'TURN ' + ((phase < .5 ? 1 : 3) + (section >= .5 ? 1 : 0));
}
export const freshLap = (best = null) => ({completed: 0, started: 0, last: null, best});
export function updateLap(state, progress, crossingTime) {
  const completed = Math.max(0, Math.floor(progress / TRACK));
  if (completed <= state.completed) return {...state, crossed: false};
  const last = crossingTime - state.started;
  const personalBest = last > 0 && (state.best === null || last < state.best);
  return {completed, started: crossingTime, last, best: personalBest ? last : state.best, crossed: true, personalBest};
}
export const trackGap = (from, to) => ((to - from + TRACK / 2) % TRACK + TRACK) % TRACK - TRACK / 2;
export const racePosition = (progress, rivals) => 1 + rivals.filter(c => c.progress > progress).length;
export function drafting(playerX, carX, gap) {return gap > 300 && gap < 2400 && Math.abs(playerX - carX) < .19;}
export function collision(playerX, carX, gap) {return Math.abs(gap) < 185 && Math.abs(playerX - carX) < .205;}
export function stepCharge(charge, isDraft, dt, boosting) {return boosting ? 0 : clamp(charge + (isDraft ? dt / 1.65 : -dt / .95), 0, 1);}
export function createField() {
  const lanes = [0, .33, -.33, .66, -.66];
  return Array.from({length: FIELD_SIZE - 1}, (_, id) => ({
    id, number: [8, 64, 16, 42, 71, 3, 88, 12, 56, 91, 6][id],
    x: lanes[id % lanes.length], target: lanes[id % lanes.length],
    progress: 1250 + id * 1650, speed: 6000, boost: 0, charge: 0,
    engine: .993 + (id * 7 % 11) * .0015, decision: .5 + id * .11,
    wasAhead: true,
  }));
}
// All rivals persist. Pace depends on engine, racing line and drafting, never rank.
export function stepRivals(rivals, player, dt, elapsed) {
  const actors = [...rivals.map(c => ({...c})), {...player, id: -1}];
  for (const c of rivals) {
    const ahead = actors.filter(o => o.id !== c.id)
      .map(o => ({...o, gap: trackGap(c.progress, o.progress)}))
      .filter(o => o.gap > 0 && Math.abs(o.x - c.x) < .23)
      .sort((a,b) => a.gap - b.gap)[0];
    c.boost = Math.max(0, c.boost - dt);
    const inDraft = ahead && drafting(c.x, ahead.x, ahead.gap);
    c.charge = c.boost > 0 ? 0 : clamp(c.charge + (inDraft ? dt / 3.2 : -dt), 0, 1);
    if (c.charge >= 1) {c.boost = 2.5; c.charge = 0;}
    c.decision -= dt;
    if (ahead && ahead.gap < (c.boost > 0 ? 2600 : 950) && c.decision <= 0) {
      const options = [clamp(c.target - .33, -.66, .66), clamp(c.target + .33, -.66, .66)];
      if (c.id % 2) options.reverse();
      const safe = options.find(lane => Math.abs(lane - c.x) > .2 && !actors.some(o => {
        if (o.id === c.id) return false;
        const gap = trackGap(c.progress, o.progress);
        const inPath = o.x > Math.min(c.x, lane) - .24 && o.x < Math.max(c.x, lane) + .24;
        // A blocker in our current lane must not forbid moving away from it.
        if (gap > 250 && Math.abs(o.x - c.x) < .24 && Math.abs(lane - o.x) > .26) return false;
        return inPath && gap > -850 && gap < 1100;
      }));
      if (safe !== undefined) c.target = safe;
      c.decision = .4;
    }
    // Seek a tow when running alone, so the pack forms and attacks naturally.
    if ((!ahead || ahead.gap > 3000) && c.boost <= 0 && c.decision <= 0) {
      const tow = actors.filter(o => o.id !== c.id)
        .map(o => ({...o, gap: trackGap(c.progress, o.progress)}))
        .filter(o => o.gap > 1200 && o.gap < 5500).sort((a,b) => a.gap - b.gap)[0];
      if (tow && !actors.some(o => o.id !== c.id && Math.abs(trackGap(c.progress, o.progress)) < 950 &&
          o.x > Math.min(c.x, tow.x) - .24 && o.x < Math.max(c.x, tow.x) + .24)) c.target = clamp(tow.x, -.66, .66);
      c.decision = 1.5;
    }
    // Clear-air rivals drive the same entry/apex/exit line available to the player.
    if ((!ahead || ahead.gap > 2700) && c.boost <= 0 && bankAt(c.progress + 4500) > .03) {
      const line = racingLineAt(c.progress + 2500);
      const safe = !actors.some(o => o.id !== c.id && Math.abs(trackGap(c.progress, o.progress)) < 1000 &&
        o.x > Math.min(c.x, line) - .24 && o.x < Math.max(c.x, line) + .24);
      if (safe) c.target = line;
    }
    c.x += clamp(c.target - c.x, -dt * .7, dt * .7);
    const target = linePace(racePace(elapsed) * c.engine, c.x, c.progress) + (c.boost > 0 ? 2400 : 0);
    c.speed += (target - c.speed) * Math.min(1, dt * 2.5);
    // Brake behind an occupied line; AI never drives through the player's rear.
    const blocker = actors.filter(o => o.id !== c.id && Math.abs(o.x - c.x) < .24)
      .map(o => ({...o, gap: trackGap(c.progress, o.progress)}))
      .filter(o => o.gap > 0).sort((a,b) => a.gap - b.gap)[0];
    if (blocker) c.speed = Math.min(c.speed, Math.max(0, blocker.speed + (blocker.gap - 390) * 2));
    c.progress += c.speed * dt;
  }
}

export const freshContact = () => ({heat: 0, cooldown: 0, wobble: 0, spin: 0});
export function advanceContact(state, dt) {
  return {heat: Math.max(0, state.heat - dt * .12), cooldown: Math.max(0, state.cooldown - dt),
    wobble: Math.max(0, state.wobble - dt), spin: Math.max(0, state.spin - dt)};
}
export function registerContact(state, closingSpeed) {
  if (state.cooldown > 0) return {...state, event: null};
  const heat = state.heat + .34 + clamp(Math.abs(closingSpeed) / 12000, 0, .24);
  if (heat >= 1) return {heat: .2, cooldown: 2.6, wobble: 0, spin: 1.6, event: 'spin'};
  return {...state, heat, cooldown: .65, wobble: .85, event: 'bump'};
}
