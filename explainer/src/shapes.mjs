// Minimal white line-art illustrations, all expressed as poly-lines so they can "draw on".
import {
  arcPoly, smoothPoly, transformPolys, drawPolys, drawText, lerp, clamp, polyLen,
} from './engine.mjs';

// ---------------------------------------------------------------- brain
function scallop(poly, amp, count, phase = 0) {
  // push points along the normal with a rounded-bump pattern (cloud / gyri look)
  const L = polyLen(poly);
  const out = [];
  let acc = 0;
  for (let i = 0; i < poly.length; i++) {
    if (i > 0) acc += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
    const a = poly[Math.max(0, i - 1)], b = poly[Math.min(poly.length - 1, i + 1)];
    let nx = b[1] - a[1], ny = -(b[0] - a[0]);
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl; ny /= nl;
    const s = acc / L;
    const bump = Math.pow(Math.abs(Math.sin(Math.PI * count * s + phase)), 0.55) - 0.55;
    out.push([poly[i][0] - nx * amp * bump, poly[i][1] - ny * amp * bump]);
  }
  return out;
}

const BRAIN_OUTLINE = [
  [-0.80, 0.25], [-0.97, 0.02], [-0.92, -0.33], [-0.72, -0.58], [-0.42, -0.74], [-0.06, -0.80],
  [0.30, -0.76], [0.62, -0.62], [0.86, -0.38], [0.97, -0.08], [0.92, 0.18], [0.72, 0.32],
  [0.42, 0.38], [0.15, 0.36], [-0.15, 0.42], [-0.45, 0.42], [-0.68, 0.36],
];

const BRAIN_FOLDS = [
  // lateral sulcus
  [[-0.66, 0.30], [-0.40, 0.17], [-0.12, 0.13], [0.18, 0.06], [0.42, -0.06]],
  // central sulcus
  [[0.02, -0.78], [0.09, -0.52], [-0.01, -0.30], [0.07, -0.08]],
  // frontal gyri
  [[-0.86, -0.08], [-0.62, -0.17], [-0.66, -0.38], [-0.44, -0.44], [-0.38, -0.64]],
  [[-0.76, 0.12], [-0.52, 0.02], [-0.32, -0.14], [-0.14, -0.06]],
  [[-0.24, -0.30], [-0.12, -0.46], [-0.22, -0.62]],
  // parietal
  [[0.24, -0.66], [0.30, -0.42], [0.50, -0.46], [0.60, -0.26], [0.82, -0.22]],
  [[0.20, -0.22], [0.34, -0.14], [0.40, -0.30]],
  // occipital
  [[0.62, 0.04], [0.78, -0.02], [0.86, 0.10]],
  // temporal
  [[-0.40, 0.31], [-0.12, 0.25], [0.10, 0.29], [0.33, 0.24]],
];

/** Brain side view in unit coords (approx x -1..1, y -0.8..0.85), facing left. */
export function brainPolys() {
  const outline = scallop(smoothPoly(BRAIN_OUTLINE, true, 12), 0.05, 13);
  const folds = BRAIN_FOLDS.map((p) => smoothPoly(p, false, 10));
  const cereb = scallop(arcPoly(0.60, 0.44, 0.30, 0.17, -0.15 * Math.PI, 1.05 * Math.PI, 40), 0.03, 5);
  const cerebLines = [arcPoly(0.60, 0.44, 0.20, 0.08, 0.05 * Math.PI, 0.95 * Math.PI, 20)];
  const stem = [
    smoothPoly([[0.30, 0.42], [0.33, 0.62], [0.36, 0.84]], false, 8),
    smoothPoly([[0.46, 0.58], [0.47, 0.70], [0.48, 0.84]], false, 8),
  ];
  return { outline: [outline], inner: [...folds, cereb, ...cerebLines, ...stem] };
}

export function drawBrain(ctx, x, y, size, { progress = 1, alpha = 1, width = 5, innerDelay = 0.25, mirror = false } = {}) {
  const b = brainPolys();
  const tf = { x, y, s: size, sx: mirror ? -size : size, sy: size };
  const po = clamp(progress / (1 - innerDelay * 0.5));
  const pi = clamp((progress - innerDelay) / (1 - innerDelay));
  drawPolys(ctx, transformPolys(b.outline, tf), { progress: po, width, alpha });
  drawPolys(ctx, transformPolys(b.inner, tf), { progress: pi, width: width * 0.8, alpha: alpha * 0.92, stagger: 0.35 });
}

/** Neural sparks travelling along the folds of the brain. */
export function drawBrainSparks(ctx, x, y, size, time, alpha = 1) {
  if (alpha <= 0) return;
  const b = brainPolys();
  const folds = transformPolys(b.inner.slice(0, 9), { x, y, s: size });
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  folds.forEach((p, i) => {
    const f = (time * 0.35 + i * 0.37) % 1;
    const idx = Math.floor(f * (p.length - 1));
    const [px, py] = p[idx];
    ctx.globalAlpha = ga0 * (alpha * Math.sin(f * Math.PI));
    ctx.beginPath();
    ctx.arc(px, py, size * 0.022, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ---------------------------------------------------------------- person
export const POSE_STAND = { lean: 0, thighL: 0.06, kneeL: 0.02, thighR: -0.06, kneeR: 0.02, armL: 0.12, elbowL: -0.12, armR: -0.12, elbowR: -0.12, head: 0 };

export function walkPose(phase, amt = 1) {
  const s = Math.sin(phase), c = Math.cos(phase);
  return {
    lean: 0.06 * amt,
    thighL: 0.42 * s * amt, kneeL: (0.08 + 0.55 * Math.max(0, -c)) * amt,
    thighR: -0.42 * s * amt, kneeR: (0.08 + 0.55 * Math.max(0, c)) * amt,
    armL: -0.45 * s * amt, elbowL: -0.35 * amt,
    armR: 0.45 * s * amt, elbowR: -0.35 * amt,
    head: 0, bob: Math.abs(c) * 0.012 * amt,
  };
}

export function mixPose(a, b, t) {
  const out = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = lerp(a[k] || 0, b[k] || 0, t);
  return out;
}

export const POSE_THINK = { lean: -0.02, thighL: 0.05, kneeL: 0.02, thighR: -0.05, kneeR: 0.02, armL: 0.9, elbowL: -2.3, armR: 0.25, elbowR: -1.3, head: 0.12 };
export const POSE_CHEER = { lean: 0, thighL: 0.12, kneeL: 0.04, thighR: -0.12, kneeR: 0.04, armL: 2.6, elbowL: 0.15, armR: -2.6, elbowR: -0.15, head: -0.1 };
export const POSE_KNEEL = { lean: 0.35, thighL: 1.1, kneeL: 2.0, thighR: 0.25, kneeR: 1.5, armL: 0.6, elbowL: -0.5, armR: 0.9, elbowR: -0.3, head: 0.1 };
export const POSE_POINT = { lean: 0.02, thighL: 0.06, kneeL: 0.02, thighR: -0.06, kneeR: 0.02, armL: 1.45, elbowL: 0.05, armR: -0.1, elbowR: -0.1, head: -0.05 };

/**
 * Compute stick-figure joints. Origin = point on the ground under the hips.
 * h = total height in px. facing 1 = right, -1 = left. rot rotates the whole body about `pivot` (ground point).
 */
export function personJoints(pose, h, facing = 1) {
  const P = { ...POSE_STAND, ...pose };
  const thigh = 0.25 * h, shin = 0.24 * h, torso = 0.30 * h, upper = 0.16 * h, fore = 0.15 * h, headR = 0.085 * h;
  // angles measured from straight down, positive = forward (toward facing)
  const dir = (a) => [Math.sin(a) * facing, Math.cos(a)];
  const hip = [0, 0];
  const kneeL = [hip[0] + dir(P.thighL)[0] * thigh, hip[1] + dir(P.thighL)[1] * thigh];
  const footL = [kneeL[0] + dir(P.thighL - P.kneeL)[0] * shin, kneeL[1] + dir(P.thighL - P.kneeL)[1] * shin];
  const kneeR = [hip[0] + dir(P.thighR)[0] * thigh, hip[1] + dir(P.thighR)[1] * thigh];
  const footR = [kneeR[0] + dir(P.thighR - P.kneeR)[0] * shin, kneeR[1] + dir(P.thighR - P.kneeR)[1] * shin];
  const up = [Math.sin(P.lean) * facing, -Math.cos(P.lean)];
  const neck = [hip[0] + up[0] * torso, hip[1] + up[1] * torso];
  const sh = [hip[0] + up[0] * torso * 0.9, hip[1] + up[1] * torso * 0.9];
  const armDir = (a) => [Math.sin(a + P.lean) * facing, Math.cos(a + P.lean)];
  const elL = [sh[0] + armDir(P.armL)[0] * upper, sh[1] + armDir(P.armL)[1] * upper];
  const haL = [elL[0] + armDir(P.armL + P.elbowL)[0] * fore, elL[1] + armDir(P.armL + P.elbowL)[1] * fore];
  const elR = [sh[0] + armDir(P.armR)[0] * upper, sh[1] + armDir(P.armR)[1] * upper];
  const haR = [elR[0] + armDir(P.armR + P.elbowR)[0] * fore, elR[1] + armDir(P.armR + P.elbowR)[1] * fore];
  const hd = [Math.sin(P.lean + P.head) * facing, -Math.cos(P.lean + P.head)];
  const head = [neck[0] + hd[0] * headR * 1.25, neck[1] + hd[1] * headR * 1.25];
  // ground the lowest foot at y=0
  const lift = Math.max(footL[1], footR[1]) + (P.bob || 0) * h;
  const J = { hip, kneeL, footL, kneeR, footR, neck, sh, elL, haL, elR, haR, head, headR };
  for (const k of Object.keys(J)) if (Array.isArray(J[k])) J[k] = [J[k][0], J[k][1] - lift];
  return J;
}

function rotPt([x, y], cx, cy, a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/**
 * Draw a minimal person. x,y = ground point. Returns joints in world coords (handy for hats, props).
 * opts.rot rotates the whole figure around opts.pivot ([dx,dy] relative to x,y; default feet).
 */
export function drawPerson(ctx, x, y, h, pose = {}, { facing = 1, progress = 1, alpha = 1, width, rot = 0, pivot = [0, 0], headFill = true } = {}) {
  const J0 = personJoints(pose, h, facing);
  const tr = (p) => {
    const r = rot ? rotPt(p, pivot[0], pivot[1], rot) : p;
    return [x + r[0], y + r[1]];
  };
  const J = {};
  for (const k of Object.keys(J0)) J[k] = Array.isArray(J0[k]) ? tr(J0[k]) : J0[k];
  const w = width || Math.max(3, h * 0.026);
  if (alpha <= 0 || progress <= 0) return J;
  const limbs = [
    [J.hip, J.neck],
    [J.hip, J.kneeL, J.footL],
    [J.hip, J.kneeR, J.footR],
    [J.sh, J.elL, J.haL],
    [J.sh, J.elR, J.haR],
  ];
  const head = arcPoly(J.head[0], J.head[1], J.headR, J.headR, -Math.PI / 2, Math.PI * 1.5, 40);
  // body first, then head drawn over it
  drawPolys(ctx, limbs, { progress: clamp(progress * 1.25 - 0.25), width: w, alpha });
  if (headFill && progress > 0.2) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(J.head[0], J.head[1], J.headR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  drawPolys(ctx, [head], { progress: clamp(progress * 1.4), width: w, alpha });
  return J;
}

// ---------------------------------------------------------------- props
export function drawGradCap(ctx, hx, hy, r, { progress = 1, alpha = 1, tilt = -0.12, width = 4, swing = 0 } = {}) {
  const tf = { x: hx, y: hy, s: r, rot: tilt };
  const top = [[-1.55, -0.95], [0, -1.35], [1.55, -0.95], [0, -0.55], [-1.55, -0.95]];
  const base = [[-0.85, -0.82], [-0.8, -0.38], [0, -0.22], [0.8, -0.38], [0.85, -0.82]];
  const tx = 1.25, ty = -1.02;
  const tassel = [[0, -0.95], [tx, ty], [tx + 0.05 + swing * 0.3, ty + 0.85]];
  const end = [[tx - 0.1 + swing * 0.3, ty + 0.85], [tx + 0.2 + swing * 0.3, ty + 0.85], [tx + 0.15 + swing * 0.33, ty + 1.15], [tx - 0.05 + swing * 0.33, ty + 1.15], [tx - 0.1 + swing * 0.3, ty + 0.85]];
  const polys = transformPolys([top, base, tassel, end], tf);
  // fill top in black so it occludes
  if (progress > 0.3) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    polys[0].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.fill();
    ctx.restore();
  }
  drawPolys(ctx, polys, { progress, width, alpha });
}

export function drawBook(ctx, x, y, w, h, { rot = 0, progress = 1, alpha = 1, width = 4, fill = true } = {}) {
  const r = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]];
  const spine = [[-w / 2 + w * 0.12, -h / 2], [-w / 2 + w * 0.12, h / 2]];
  const label = [[-w / 2 + w * 0.32, -h * 0.1], [w / 2 - w * 0.15, -h * 0.1]];
  const polys = transformPolys([r, spine, label], { x, y, rot });
  if (fill && progress > 0.3) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    polys[0].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.fill();
    ctx.restore();
  }
  drawPolys(ctx, polys, { progress, width, alpha });
}

/** Horizontal book lying in a stack (spine facing viewer). */
export function drawStackBook(ctx, x, y, w, h, opts = {}) {
  const { rot = 0, progress = 1, alpha = 1, width = 4 } = opts;
  const r = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]];
  const band1 = [[-w / 2 + w * 0.12, -h / 2], [-w / 2 + w * 0.12, h / 2]];
  const band2 = [[w / 2 - w * 0.12, -h / 2], [w / 2 - w * 0.12, h / 2]];
  const polys = transformPolys([r, band1, band2], { x, y, rot });
  if (progress > 0.3) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    polys[0].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.fill();
    ctx.restore();
  }
  drawPolys(ctx, polys, { progress, width, alpha });
}

export function drawPlanSheet(ctx, x, y, w, h, { rot = 0, progress = 1, alpha = 1, width = 3.5, checks = 3 } = {}) {
  const f = w * 0.22;
  const outline = [[-w / 2, -h / 2], [w / 2 - f, -h / 2], [w / 2, -h / 2 + f], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]];
  const fold = [[w / 2 - f, -h / 2], [w / 2 - f, -h / 2 + f], [w / 2, -h / 2 + f]];
  const polys = [outline, fold];
  for (let i = 0; i < checks; i++) {
    const yy = -h / 2 + h * 0.3 + i * h * 0.22;
    const bx = -w / 2 + w * 0.14, bs = w * 0.11;
    polys.push([[bx, yy - bs / 2], [bx + bs, yy - bs / 2], [bx + bs, yy + bs / 2], [bx, yy + bs / 2], [bx, yy - bs / 2]]);
    polys.push([[bx + bs * 1.8, yy], [w / 2 - w * 0.14 - (i % 2) * w * 0.15, yy]]);
  }
  const tp = transformPolys(polys, { x, y, rot });
  if (progress > 0.3) {
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    tp[0].forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.fill();
    ctx.restore();
  }
  drawPolys(ctx, tp, { progress, width, alpha });
}

export function drawClock(ctx, x, y, r, time, { progress = 1, alpha = 1, width = 4 } = {}) {
  const polys = [arcPoly(x, y, r, r, -Math.PI / 2, Math.PI * 1.5, 60)];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const k = i % 3 === 0 ? 0.78 : 0.86;
    polys.push([[x + Math.cos(a) * r * k, y + Math.sin(a) * r * k], [x + Math.cos(a) * r * 0.93, y + Math.sin(a) * r * 0.93]]);
  }
  drawPolys(ctx, polys, { progress, width, alpha });
  if (progress > 0.6) {
    const ha = alpha * clamp((progress - 0.6) / 0.4);
    const sec = Math.floor(time) * ((Math.PI * 2) / 12) - Math.PI / 2; // ticks once per second
    const min = -Math.PI / 2 + time * 0.05;
    drawPolys(ctx, [[[x, y], [x + Math.cos(min) * r * 0.5, y + Math.sin(min) * r * 0.5]], [[x, y], [x + Math.cos(sec) * r * 0.72, y + Math.sin(sec) * r * 0.72]]], { width, alpha: ha });
  }
}

export function drawBulb(ctx, x, y, r, { progress = 1, alpha = 1, width = 4, rays = 0, time = 0 } = {}) {
  const glass = arcPoly(x, y, r, r, Math.PI * 0.72, Math.PI * 2.28, 60);
  const neckL = [glass[0], [x - r * 0.42, y + r * 1.15]];
  const neckR = [glass[glass.length - 1], [x + r * 0.42, y + r * 1.15]];
  const screws = [0, 1, 2].map((i) => [[x - r * 0.42, y + r * (1.15 + i * 0.2)], [x + r * 0.42, y + r * (1.15 + i * 0.2)]]);
  const tip = [[x - r * 0.25, y + r * 1.6], [x + r * 0.25, y + r * 1.6]];
  const fil = [[x - r * 0.3, y + r * 0.9], [x - r * 0.3, y + r * 0.1], [x - r * 0.15, y - r * 0.15], [x, y + r * 0.1], [x + r * 0.15, y - r * 0.15], [x + r * 0.3, y + r * 0.1], [x + r * 0.3, y + r * 0.9]];
  drawPolys(ctx, [glass, neckL, neckR, ...screws, tip, fil], { progress, width, alpha });
  if (rays > 0) {
    const polys = [];
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.42;
      const pulse = 1 + 0.08 * Math.sin(time * 4 + i);
      polys.push([[x + Math.cos(a) * r * 1.35 * pulse, y + Math.sin(a) * r * 1.35 * pulse], [x + Math.cos(a) * r * 1.75 * pulse, y + Math.sin(a) * r * 1.75 * pulse]]);
    }
    drawPolys(ctx, polys, { progress: rays, width, alpha });
  }
}

export function drawCoin(ctx, x, y, r, { scale = 1, alpha = 1, width = 4 } = {}) {
  if (scale <= 0 || alpha <= 0) return;
  const rr = r * scale;
  drawPolys(ctx, [arcPoly(x, y, rr, rr, 0, Math.PI * 2, 48), arcPoly(x, y, rr * 0.78, rr * 0.78, 0, Math.PI * 2, 48)], { width, alpha });
  drawText(ctx, '$', x, y + rr * 0.05, { size: rr * 1.05, weight: 'bold', alpha });
}

export function drawBill(ctx, x, y, w, h, { rot = 0, alpha = 1, progress = 1, width = 3.5 } = {}) {
  const r = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]];
  const inner = [[-w / 2 + 8, -h / 2 + 8], [w / 2 - 8, -h / 2 + 8], [w / 2 - 8, h / 2 - 8], [-w / 2 + 8, h / 2 - 8], [-w / 2 + 8, -h / 2 + 8]];
  const circ = arcPoly(0, 0, h * 0.28, h * 0.28, 0, Math.PI * 2, 32);
  drawPolys(ctx, transformPolys([r, inner, circ], { x, y, rot }), { progress, width, alpha });
  if (progress > 0.5) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawText(ctx, '$', 0, 2, { size: h * 0.4, weight: 'bold', alpha: alpha * clamp((progress - 0.5) * 2) });
    ctx.restore();
  }
}

export function arrowPolys(pts, head = 22, curved = true) {
  const line = curved && pts.length > 2 ? smoothPoly(pts, false, 14) : pts;
  const n = line.length;
  const [ex, ey] = line[n - 1];
  const [px, py] = line[Math.max(0, n - 3)];
  const a = Math.atan2(ey - py, ex - px);
  const h1 = [[ex + Math.cos(a + 2.6) * head, ey + Math.sin(a + 2.6) * head], [ex, ey], [ex + Math.cos(a - 2.6) * head, ey + Math.sin(a - 2.6) * head]];
  return { line, head: h1 };
}

export function drawArrow(ctx, pts, { progress = 1, alpha = 1, width = 5, head = 22, curved = true, dashed = false } = {}) {
  const { line, head: hp } = arrowPolys(pts, head, curved);
  if (dashed) ctx.setLineDash([2, 16]);
  drawPolys(ctx, [line], { progress: clamp(progress / 0.85), width, alpha });
  ctx.setLineDash([]);
  const ph = clamp((progress - 0.8) / 0.2);
  drawPolys(ctx, [hp], { progress: ph, width, alpha });
}

export function stairsPoly(x0, y0, steps, stepW, stepH) {
  const p = [[x0 - stepW * 0.6, y0]];
  let x = x0, y = y0;
  p.push([x, y]);
  for (let i = 0; i < steps; i++) {
    y -= stepH; p.push([x, y]);
    x += stepW; p.push([x, y]);
  }
  return p;
}

export function drawGraph(ctx, x, y, w, h, { progress = 1, alpha = 1, width = 4, values = [0.08, 0.22, 0.18, 0.4, 0.36, 0.62, 0.88] } = {}) {
  const axes = [[x, y - h], [x, y], [x + w, y]];
  drawPolys(ctx, [axes], { progress: clamp(progress * 2.5), width, alpha: alpha * 0.8 });
  const pts = values.map((v, i) => [x + (w * (i + 0.5)) / values.length, y - v * h]);
  const pl = clamp((progress - 0.3) / 0.7);
  if (pl > 0) {
    drawArrow(ctx, pts, { progress: pl, width: width + 1, alpha, head: 20, curved: false });
    ctx.save();
    const ga0 = ctx.globalAlpha;
    ctx.fillStyle = '#fff';
    pts.forEach(([px, py], i) => {
      const k = clamp(pl * values.length - i);
      if (k <= 0 || i === pts.length - 1) return;
      ctx.globalAlpha = ga0 * (alpha * k);
      ctx.beginPath();
      ctx.arc(px, py, width * 1.6, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

export function drawFlag(ctx, x, y, h, time, { progress = 1, alpha = 1, width = 4 } = {}) {
  const pole = [[x, y], [x, y - h]];
  const wv = Math.sin(time * 3) * h * 0.03;
  const flag = smoothPoly([[x, y - h], [x + h * 0.25, y - h * 0.94 + wv], [x + h * 0.5, y - h * 0.86], [x + h * 0.25, y - h * 0.78 - wv], [x, y - h * 0.72]], false, 8);
  drawPolys(ctx, [pole, flag], { progress, width, alpha, mode: 'sequential' });
}

export function drawRock(ctx, x, y, w, { progress = 1, alpha = 1, width = 4 } = {}) {
  const p = smoothPoly([[x - w / 2, y], [x - w * 0.38, y - w * 0.32], [x - w * 0.05, y - w * 0.45], [x + w * 0.3, y - w * 0.35], [x + w / 2, y]], false, 8);
  drawPolys(ctx, [p], { progress, width, alpha });
}

export function drawThoughtDots(ctx, x, y, time, { alpha = 1, r = 7 } = {}) {
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 3; i++) {
    const k = 0.35 + 0.65 * Math.max(0, Math.sin(time * 4 - i * 0.8));
    ctx.globalAlpha = ga0 * (alpha * k);
    ctx.beginPath();
    ctx.arc(x + i * r * 3.2, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** Small label pill connected to a point with a thin line. */
export function drawCallout(ctx, text, x, y, ax, ay, t, { size = 34, alpha = 1, spacing = 3, width = 3 } = {}) {
  if (t <= 0) return;
  const k = clamp(t / 0.35);
  // connector line from anchor to label
  drawPolys(ctx, [[[ax, ay], [lerp(ax, x, 0.82), lerp(ay, y, 0.82)]]], { progress: k, width: 2.5, alpha: alpha * 0.7 });
  ctx.save();
  const ga0 = ctx.globalAlpha;
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = ga0 * (alpha * k);
  ctx.beginPath();
  ctx.arc(ax, ay, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  const s = 0.6 + 0.4 * Math.min(1, (t - 0.12) / 0.3 > 0 ? 1 - Math.pow(1 - clamp((t - 0.12) / 0.3), 3) * 1 : 0);
  if (t > 0.12) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const tw = drawWidth(ctx, text, size, spacing);
    const w = tw + size * 1.1, h = size * 1.7;
    const a = alpha * clamp((t - 0.12) / 0.25);
    drawPolys(ctx, [[[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]]], { width, alpha: a });
    drawText(ctx, text, 0, 2, { size, weight: 'xbold', alpha: a, spacing });
    ctx.restore();
  }
}

function drawWidth(ctx, text, size, spacing) {
  ctx.save();
  ctx.font = `${size}px InterXBold`;
  ctx.letterSpacing = `${spacing}px`;
  const w = ctx.measureText(text).width - spacing;
  ctx.restore();
  return w;
}
