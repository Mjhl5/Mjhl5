#!/usr/bin/env node
// Renders the explainer to MP4 (1920x1080) in parallel chunks, then mixes audio and muxes.
//
//   node render.mjs                         # full render -> out/explainer.mp4
//   node render.mjs --still 12.5            # one PNG frame at 12.5 s -> out/still_12.50.png
//   node render.mjs --voice path/to/vo.mp3  # include the voiceover in the mix
//
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { Compositor, W, H, FPS, drawDotGrid, window01, prog, easeOutCubic, easeInCubic, clamp } from './src/engine.mjs';
import { buildTimeline, sfxCues } from './src/storyboard.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(path.join(OUT, 'parts'), { recursive: true });

const args = process.argv.slice(2);
const arg = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const tl = buildTimeline();

function drawAt(comp, T) {
  const scenes = tl.scenes;
  let s = scenes.find((sc) => T >= sc.start && T < sc.start + sc.dur);
  if (!s) s = T < scenes[0].start ? scenes[0] : scenes[scenes.length - 1];
  const t = T - s.start;
  const first = s === scenes[0], last = s === scenes[scenes.length - 1];
  const fade = window01(t, 0, s.dur, first ? 0.3 : 0.4, last ? 0.9 : 0.4);
  const cam = { ...s.cam(t) };
  // small push on the way in and out of every scene
  cam.zoom *= 1 + 0.025 * (1 - easeOutCubic(prog(t, 0, 0.7))) + 0.03 * easeInCubic(prog(t, s.dur - 0.45, 0.45));
  const bgA = clamp(prog(T, 0, 1.4)) * (1 - prog(T, tl.total - 1.6, 1.2));
  return comp.frame({
    drawBg: (c) => drawDotGrid(c, T, { alpha: bgA, focusX: 960, focusY: 540, radius: 1150, base: 0.06, peak: 0.19 }),
    drawFg: (c) => { c.globalAlpha = fade; if (fade > 0) s.draw(c, t); },
    cam,
  });
}

async function renderPart(i, n, file) {
  const frames = Math.ceil(tl.total * FPS);
  const f0 = Math.floor((frames * i) / n), f1 = Math.floor((frames * (i + 1)) / n);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  const comp = new Compositor();
  for (let f = f0; f < f1; f++) {
    const canvas = drawAt(comp, f / FPS);
    const buf = canvas.data();
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (c) => (c === 0 ? r() : j(new Error(`ffmpeg exited ${c}`)))));
}

async function main() {
  if (args.includes('--part')) {
    await renderPart(+arg('--part'), +arg('--parts'), arg('--file'));
    return;
  }
  if (args.includes('--still')) {
    const T = parseFloat(arg('--still'));
    const comp = new Compositor();
    const file = path.join(OUT, `still_${T.toFixed(2)}.png`);
    fs.writeFileSync(file, drawAt(comp, T).toBuffer('image/png'));
    console.log(file);
    return;
  }

  const cues = sfxCues(tl);
  fs.writeFileSync(path.join(OUT, 'cues.json'), JSON.stringify({ total: tl.total, scenes: tl.scenes.map((s) => ({ id: s.id, title: s.title, start: s.start, dur: s.dur })), cues }, null, 2));
  console.log(`timeline ${tl.total.toFixed(2)} s, ${tl.scenes.length} scenes, ${cues.length} sfx cues`);

  const n = +(arg('--jobs', '4'));
  const t0 = Date.now();
  const files = [...Array(n).keys()].map((i) => path.join(OUT, 'parts', `part_${i}.mp4`));
  await Promise.all(files.map((file, i) => new Promise((res, rej) => {
    const p = spawn(process.execPath, [fileURLToPath(import.meta.url), '--part', String(i), '--parts', String(n), '--file', file], { stdio: 'inherit' });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`part ${i} failed`))));
  })));
  console.log(`video rendered in ${((Date.now() - t0) / 1000).toFixed(1)} s`);

  const list = path.join(OUT, 'parts', 'list.txt');
  fs.writeFileSync(list, files.map((f) => `file '${f}'`).join('\n'));
  const silent = path.join(OUT, 'video_silent.mp4');
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent], { stdio: 'inherit' });

  const mix = path.join(OUT, 'mix.wav');
  const voice = arg('--voice');
  const mixArgs = [path.join(ROOT, 'tools', 'mix.py'), '--cues', path.join(OUT, 'cues.json'), '--out', mix];
  if (voice) mixArgs.push('--voice', voice);
  const r = spawnSync('python3', mixArgs, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('mix failed');

  const final = path.join(OUT, arg('--out', 'explainer.mp4'));
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', mix, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', '-shortest', final], { stdio: 'inherit' });
  console.log(final);
}

main().catch((e) => { console.error(e); process.exit(1); });
