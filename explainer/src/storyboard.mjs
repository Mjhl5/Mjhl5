// Master timeline. Scenes play back to back; each can be pinned to an absolute `start`
// (seconds in the voiceover) once word timestamps from the real MP3 are known.
import { ALL } from './scenes.mjs';

export const TIMELINE = [
  { scene: 'hook' },
  { scene: 'contrast' },
  { scene: 'knowAct' },
  { scene: 'result' },
];

export const TAIL = 0.8; // black after the last scene

export function buildTimeline(entries = TIMELINE) {
  let t = 0;
  const out = entries.map((e) => {
    const sc = ALL[e.scene];
    if (!sc) throw new Error(`unknown scene ${e.scene}`);
    const start = e.start ?? t;
    const dur = e.dur ?? sc.dur;
    t = start + dur;
    return { ...sc, start, dur };
  });
  return { scenes: out, total: t + TAIL };
}

export function sfxCues(tl) {
  const cues = [];
  for (const s of tl.scenes) {
    for (const [t, name, gain] of s.sfx()) {
      if (t < 0 || t > s.dur + 0.5) continue;
      cues.push({ t: +(s.start + t).toFixed(4), name, gain, scene: s.id });
    }
  }
  return cues.sort((a, b) => a.t - b.t);
}
