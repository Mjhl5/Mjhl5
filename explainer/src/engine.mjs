// Core drawing engine: easing, poly-line "draw-on" strokes, glow/bloom, text, boxes, dotted backgrounds.
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

export const W = 1920;
export const H = 1080;
export const FPS = 30;

const FONT_DIR = '/usr/share/fonts/opentype/inter';
GlobalFonts.registerFromPath(`${FONT_DIR}/Inter-Medium.otf`, 'InterMedium');
GlobalFonts.registerFromPath(`${FONT_DIR}/Inter-SemiBold.otf`, 'InterSemi');
GlobalFonts.registerFromPath(`${FONT_DIR}/Inter-Bold.otf`, 'InterBold');
GlobalFonts.registerFromPath(`${FONT_DIR}/Inter-ExtraBold.otf`, 'InterXBold');

// ---------- math & easing ----------
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const prog = (t, start, dur) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur));
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInCubic = (t) => t * t * t;
export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
export const easeOutBack = (t, s = 1.6) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);
/** fade in over [a, a+fi], hold, fade out over [b-fo, b] */
export const window01 = (t, a, b, fi = 0.4, fo = 0.4) =>
  Math.min(easeOutCubic(prog(t, a, fi)), 1 - easeInCubic(prog(t, b - fo, fo)));

export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let r = Math.imul(s ^ (s >>> 15), 1 | s);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- poly-line geometry ----------
export function polyLen(p) {
  let L = 0;
  for (let i = 1; i < p.length; i++) L += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
  return L;
}

export function arcPoly(cx, cy, rx, ry, a0, a1, n = 64) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
}

export function bezierPoly(p0, p1, p2, p3, n = 32) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

/** Catmull-Rom smoothing through control points */
export function smoothPoly(pts, closed = false, seg = 10) {
  const out = [];
  const n = pts.length;
  const get = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    for (let j = 0; j < seg; j++) {
      const t = j / seg, t2 = t * t, t3 = t2 * t;
      out.push([
        0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(closed ? [...pts[0]] : [...pts[n - 1]]);
  return out;
}

export function transformPolys(polys, { x = 0, y = 0, s = 1, sx = s, sy = s, rot = 0 } = {}) {
  const c = Math.cos(rot), si = Math.sin(rot);
  return polys.map((p) => p.map(([px, py]) => {
    const ax = px * sx, ay = py * sy;
    return [x + ax * c - ay * si, y + ax * si + ay * c];
  }));
}

/** Stroke the first `frac` (0..1) of a poly-line's length. */
export function strokePartial(ctx, p, frac) {
  if (frac <= 0 || p.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  if (frac >= 1) {
    for (let i = 1; i < p.length; i++) ctx.lineTo(p[i][0], p[i][1]);
  } else {
    const target = polyLen(p) * frac;
    let acc = 0;
    for (let i = 1; i < p.length; i++) {
      const d = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      if (acc + d >= target) {
        const k = d === 0 ? 0 : (target - acc) / d;
        ctx.lineTo(lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k));
        break;
      }
      ctx.lineTo(p[i][0], p[i][1]);
      acc += d;
    }
  }
  ctx.stroke();
}

/**
 * Draw a set of poly-lines with a draw-on progress.
 * mode 'parallel': every line grows together. 'sequential': one after another (by length).
 */
export function drawPolys(ctx, polys, { progress = 1, mode = 'parallel', width = 5, alpha = 1, color = '#fff', stagger = 0 } = {}) {
  if (progress <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (mode === 'sequential') {
    const lens = polys.map(polyLen);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    let remain = progress * total;
    for (let i = 0; i < polys.length; i++) {
      if (remain <= 0) break;
      strokePartial(ctx, polys[i], clamp(remain / (lens[i] || 1)));
      remain -= lens[i];
    }
  } else {
    const n = polys.length;
    for (let i = 0; i < n; i++) {
      // optional stagger: each line starts a little later
      const st = stagger * (n > 1 ? i / (n - 1) : 0);
      const f = clamp((progress - st) / (1 - stagger || 1));
      strokePartial(ctx, polys[i], f);
    }
  }
  ctx.restore();
}

// ---------- text ----------
export function setFont(ctx, size, weight = 'bold') {
  const fam = { medium: 'InterMedium', semi: 'InterSemi', bold: 'InterBold', xbold: 'InterXBold' }[weight] || 'InterBold';
  ctx.font = `${size}px ${fam}`;
}

export function drawText(ctx, str, x, y, { size = 48, weight = 'bold', alpha = 1, spacing = 0, align = 'center', color = '#fff', baseline = 'middle' } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  setFont(ctx, size, weight);
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillStyle = color;
  ctx.textBaseline = baseline;
  // letterSpacing adds trailing space after the last glyph; compensate for centering
  const w = ctx.measureText(str).width - spacing;
  let sx = x;
  if (align === 'center') sx = x - w / 2;
  else if (align === 'right') sx = x - w;
  ctx.textAlign = 'left';
  ctx.fillText(str, sx, y);
  ctx.restore();
  return w;
}

export function textWidth(ctx, str, size, weight = 'bold', spacing = 0) {
  ctx.save();
  setFont(ctx, size, weight);
  ctx.letterSpacing = `${spacing}px`;
  const w = ctx.measureText(str).width - spacing;
  ctx.restore();
  return w;
}

/** Rounded-rect outline as a poly starting at top-center, split into two halves that trace symmetrically. */
export function boxHalves(cx, cy, w, h, r = 6) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  const right = [[cx, y0], [x1 - r, y0], ...arcPoly(x1 - r, y0 + r, r, r, -Math.PI / 2, 0, 6).slice(1),
    [x1, y1 - r], ...arcPoly(x1 - r, y1 - r, r, r, 0, Math.PI / 2, 6).slice(1), [cx, y1]];
  const left = right.map(([px, py]) => [2 * cx - px, py]);
  return [right, left];
}

/**
 * White outlined box with an uppercase message. `t` = seconds since the box started appearing.
 * Returns nothing; draw-on border (0..0.55s), text rises in (0.25..0.8s).
 */
export function drawMessageBox(ctx, text, cx, cy, t, { size = 64, alpha = 1, padX = 46, padY = 30, spacing = 6, width = 4, weight = 'xbold', dur = 0.6 } = {}) {
  if (t <= 0 || alpha <= 0) return;
  const tw = textWidth(ctx, text, size, weight, spacing);
  const w = tw + padX * 2, h = size + padY * 2;
  const pb = easeInOutCubic(prog(t, 0, dur));
  drawPolys(ctx, boxHalves(cx, cy, w, h, 4), { progress: pb, width, alpha });
  const pt = easeOutCubic(prog(t, dur * 0.45, dur * 0.9));
  if (pt > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx - w / 2, cy - h / 2, w, h);
    ctx.clip();
    drawText(ctx, text, cx, cy + (1 - pt) * size * 0.6 + size * 0.04, { size, weight, alpha: alpha * pt, spacing });
    ctx.restore();
  }
}

// ---------- dotted backgrounds ----------
/** Full-frame subtle dot grid that drifts slowly, brighter toward a focus point. */
export function drawDotGrid(ctx, time, { alpha = 1, gap = 34, focusX = W / 2, focusY = H / 2, radius = 900, base = 0.05, peak = 0.16 } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  const ox = (time * 6) % gap, oy = (time * 3) % gap;
  for (let y = -gap; y < H + gap; y += gap) {
    for (let x = -gap; x < W + gap; x += gap) {
      const px = x + ox, py = y + oy;
      const d = Math.hypot(px - focusX, py - focusY) / radius;
      const fall = clamp(1 - d);
      const tw = 0.75 + 0.25 * Math.sin(px * 0.013 + py * 0.021 + time * 1.3);
      const a = (base + (peak - base) * fall * fall) * tw * alpha;
      if (a < 0.01) continue;
      ctx.globalAlpha = ga0 * (a);
      ctx.beginPath();
      ctx.arc(px, py, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** A circular halftone ring of dots around a point (decorative "dotted pattern"). */
export function drawDotRing(ctx, cx, cy, r0, r1, time, { alpha = 1, step = 22, seed = 3 } = {}) {
  if (alpha <= 0) return;
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  for (let r = r0; r <= r1; r += step) {
    const n = Math.floor((2 * Math.PI * r) / step);
    const k = (r - r0) / Math.max(1, r1 - r0);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + time * 0.05 * (seed % 2 ? 1 : -1) + r * 0.01;
      const tw = 0.6 + 0.4 * Math.sin(i * 1.7 + r * 0.3 + time * 2);
      ctx.globalAlpha = ga0 * (alpha * (1 - k) * 0.35 * tw);
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.8 * (1 - k * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Rectangular patch of dots (like the small dotted textures in minimalist explainers). */
export function drawDotPatch(ctx, x, y, cols, rows, gap, alpha = 0.3, time = 0) {
  if (alpha <= 0) return;
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const tw = 0.6 + 0.4 * Math.sin(i * 0.9 + j * 1.3 + time * 1.5);
      ctx.globalAlpha = ga0 * (alpha * tw);
      ctx.beginPath();
      ctx.arc(x + i * gap, y + j * gap, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

/** Soft radial glow blob (used behind important objects). */
export function drawRadialGlow(ctx, x, y, r, alpha = 0.25) {
  if (alpha <= 0) return;
  ctx.save();
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(255,255,255,${alpha})`);
  g.addColorStop(0.4, `rgba(255,255,255,${alpha * 0.35})`);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// ---------- frame compositor with bloom ----------
export class Compositor {
  constructor() {
    this.out = createCanvas(W, H);
    this.octx = this.out.getContext('2d');
    this.fg = createCanvas(W, H); // glowing layer
    this.fctx = this.fg.getContext('2d');
    this.small = createCanvas(W / 2, H / 2);
    this.sctx = this.small.getContext('2d');
    this.small2 = createCanvas(W / 2, H / 2);
    this.sctx2 = this.small2.getContext('2d');
  }

  /**
   * drawBg(ctx) draws the non-glowing background (dots).
   * drawFg(ctx) draws glowing line-art.
   * cam = {zoom, x, y} applied to both. fade multiplies the whole frame (scene transitions).
   */
  frame({ drawBg, drawFg, cam = { zoom: 1, x: 0, y: 0 }, fade = 1, bloom = 1 }) {
    const o = this.octx;
    o.globalAlpha = 1;
    o.globalCompositeOperation = 'source-over';
    o.fillStyle = '#000';
    o.fillRect(0, 0, W, H);

    const applyCam = (c) => {
      c.translate(W / 2, H / 2);
      c.scale(cam.zoom, cam.zoom);
      c.translate(-W / 2 + (cam.x || 0), -H / 2 + (cam.y || 0));
    };

    // background
    o.save();
    applyCam(o);
    if (drawBg) drawBg(o);
    o.restore();

    // foreground on transparent layer
    const f = this.fctx;
    f.setTransform(1, 0, 0, 1, 0, 0);
    f.clearRect(0, 0, W, H);
    f.save();
    applyCam(f);
    if (drawFg) drawFg(f);
    f.restore();

    // bloom: two blur radii at half-res, added on top
    if (bloom > 0) {
      const s = this.sctx;
      s.setTransform(1, 0, 0, 1, 0, 0);
      s.clearRect(0, 0, W / 2, H / 2);
      s.filter = 'blur(7px)';
      s.drawImage(this.fg, 0, 0, W / 2, H / 2);
      s.filter = 'none';
      const s2 = this.sctx2;
      s2.setTransform(1, 0, 0, 1, 0, 0);
      s2.clearRect(0, 0, W / 2, H / 2);
      s2.filter = 'blur(22px)';
      s2.drawImage(this.fg, 0, 0, W / 2, H / 2);
      s2.filter = 'none';
      o.save();
      o.globalCompositeOperation = 'lighter';
      o.globalAlpha = 0.55 * bloom;
      o.drawImage(this.small2, 0, 0, W, H);
      o.globalAlpha = 0.75 * bloom;
      o.drawImage(this.small, 0, 0, W, H);
      o.restore();
    }
    o.drawImage(this.fg, 0, 0);

    // vignette
    o.save();
    const v = o.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    o.fillStyle = v;
    o.fillRect(0, 0, W, H);
    o.restore();

    if (fade < 1) {
      o.save();
      o.globalAlpha = 1 - clamp(fade);
      o.fillStyle = '#000';
      o.fillRect(0, 0, W, H);
      o.restore();
    }
    return this.out;
  }
}
