// Scene choreography. Each scene: { id, dur, draw(ctx, t), cam(t), sfx(): [[t, name, gainDb]] }.
// All times are LOCAL to the scene (seconds). The storyboard places scenes on the master timeline.
import * as E from './engine.mjs';
import * as S from './shapes.mjs';

const { prog, clamp, lerp, easeOutCubic, easeInCubic, easeInOutCubic, easeOutBack, easeInOutSine } = E;

// ------------------------------------------------------------------ helpers
/** trapezoid velocity profile 0..1 (accelerate, cruise, decelerate) */
function travel(u, a = 0.18) {
  u = clamp(u);
  const v = 1 / (1 - a); // cruise speed so that area = 1
  if (u < a) return 0.5 * v * (u * u) / a;
  if (u > 1 - a) { const r = 1 - u; return 1 - 0.5 * v * (r * r) / a; }
  return 0.5 * v * a + v * (u - a);
}

/** Walking segment: returns position + pose; strikes() gives foot-contact times for footstep SFX. */
function walkSeg({ t0, t1, x0, x1, h }) {
  const stride = 0.42 * h;
  const at = (t) => {
    const u = (t - t0) / (t1 - t0);
    const x = lerp(x0, x1, travel(u));
    const phase = (Math.abs(x - x0) / stride) * Math.PI;
    const amt = clamp(Math.min((t - t0) / 0.22, (t1 - t) / 0.22));
    return { x, phase, amt: t < t0 || t > t1 ? 0 : amt };
  };
  const pose = (t) => {
    const s = at(t);
    return S.mixPose(S.POSE_STAND, S.walkPose(s.phase, 1), easeInOutSine(s.amt));
  };
  const strikes = () => {
    const out = [];
    let last = Math.floor((at(t0).phase - Math.PI / 2) / Math.PI);
    for (let t = t0; t <= t1; t += 1 / 240) {
      const k = Math.floor((at(t).phase - Math.PI / 2) / Math.PI);
      if (k !== last) { out.push(t); last = k; }
    }
    return out;
  };
  return { at, pose, strikes };
}

function stepCues(times, gain = -15) {
  return times.map((t, i) => [t, `step${(i % 4) + 1}`, gain]);
}

function floatY(t, amp = 6, speed = 1.3, ph = 0) { return Math.sin(t * speed + ph) * amp; }

const POSE_FALL = { lean: 0.15, thighL: 0.35, kneeL: 0.35, thighR: -0.25, kneeR: 0.15, armL: 1.7, elbowL: 0.25, armR: 1.35, elbowR: 0.35, head: -0.35 };

// ------------------------------------------------------------------ Scene 1 – THE HOOK
export const hook = {
  id: 'hook',
  title: 'THE HOOK',
  dur: 9.0,
  bg: { focusX: 960, focusY: 420 },
  cam: (t) => ({ zoom: 1.0 + 0.045 * easeInOutSine(clamp(t / 9)), x: 0, y: 0 }),
  draw(ctx, t) {
    const B = { x: 960, y: 385, s: 210 };
    const glowIn = easeOutCubic(prog(t, 0.6, 1.2));
    E.drawRadialGlow(ctx, B.x, B.y, 460, 0.13 * glowIn * (0.85 + 0.15 * Math.sin(t * 2.4)));
    E.drawDotRing(ctx, B.x, B.y, 290, 430, t, { alpha: easeOutCubic(prog(t, 0.9, 1.4)) });

    const pb = easeOutCubic(prog(t, 0.15, 1.35));
    E.drawRadialGlow(ctx, B.x, B.y, 520, 0.22 * Math.sin(Math.PI * prog(t, 0.15, 0.9)));
    const pulse = 1 + 0.018 * Math.sin(t * 2.4) * prog(t, 2.2, 1);
    const pop = 1 + 0.06 * Math.sin(Math.PI * prog(t, 0.15, 0.5)); // tiny bump on the impact
    ctx.save();
    ctx.translate(B.x, B.y);
    ctx.scale(pulse * pop, pulse * pop);
    ctx.translate(-B.x, -B.y);
    S.drawBrain(ctx, B.x, B.y, B.s, { progress: pb, width: 6 });
    ctx.restore();
    S.drawBrainSparks(ctx, B.x, B.y, B.s * pulse, t, prog(t, 2.2, 0.6));

    const labels = [
      ['SMARTEST', 520, 235, B.x - 150, B.y - 120, 2.2],
      ['A+', 1395, 225, B.x + 135, B.y - 125, 2.8],
      ['A+', 545, 555, B.x - 175, B.y + 70, 3.35],
      ['IQ 160', 1385, 545, B.x + 175, B.y + 50, 3.9],
    ];
    labels.forEach(([txt, x, y, ax, ay, t0], i) => {
      S.drawCallout(ctx, txt, x, y + floatY(t, 5, 1.1, i * 1.7) * prog(t, t0 + 0.6, 0.5), ax, ay, t - t0, { size: 38, spacing: 4 });
    });

    // graduate underneath
    const pp = easeInOutCubic(prog(t, 5.0, 1.0));
    const J = S.drawPerson(ctx, 960, 1030, 290, S.POSE_STAND, { progress: pp });
    const pc = prog(t, 5.8, 0.6);
    if (pc > 0) {
      const drop = 1 - easeOutBack(pc, 2.2);
      S.drawGradCap(ctx, J.head[0], J.head[1] - drop * 220, J.headR * 1.2, { alpha: clamp(pc * 4), width: 4.5, swing: Math.sin(t * 5) * (1 - prog(t, 6.4, 1.5)) * 0.4 });
    }
    // dotted link from graduate to brain
    const pl = easeInOutCubic(prog(t, 6.5, 0.8));
    if (pl > 0) {
      ctx.save();
      ctx.fillStyle = '#fff';
      const ga = ctx.globalAlpha;
      const yTop = B.y + B.s * 0.9, yBot = J.head[1] - J.headR * 2.4;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const k = i / (n - 1);
        if (k > pl) break;
        ctx.globalAlpha = ga * (0.5 + 0.5 * Math.sin(t * 4 - i * 0.7));
        ctx.beginPath();
        ctx.arc(B.x, lerp(yBot, yTop, k), 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  },
  sfx() {
    return [
      [0.12, 'impact', -5],
      [2.2, 'click', -12], [2.8, 'click', -12], [3.35, 'click', -12], [3.9, 'click', -12],
      [4.95, 'whoosh', -17],
      [6.2, 'click', -13], // cap lands
    ];
  },
};

// ------------------------------------------------------------------ Scene 2 – THE CONTRAST
const s2walk = walkSeg({ t0: 3.2, t1: 7.9, x0: 1120, x1: 1730, h: 270 });
export const contrast = {
  id: 'contrast',
  title: 'THE CONTRAST',
  dur: 8.6,
  bg: { focusX: 960, focusY: 560 },
  cam: (t) => ({ zoom: 1.0 + 0.035 * easeInOutSine(clamp(t / 8.6)), x: 0, y: 0 }),
  draw(ctx, t) {
    const G = 900;
    E.drawPolys(ctx, [[[170, G], [1750, G]]], { progress: easeInOutCubic(prog(t, 0.1, 1.1)), width: 3, alpha: 0.45 });

    // left: the "smart" one — huge glowing brain, standing still
    const breathe = { ...S.POSE_STAND, lean: -0.01 + 0.01 * Math.sin(t * 1.6) };
    const J = S.drawPerson(ctx, 560, G, 270, breathe, { progress: easeInOutCubic(prog(t, 0.3, 1.0)) });
    const bs = 165 * (1 + 0.025 * Math.sin(t * 2.2));
    const by = J.head[1] - 178;
    E.drawRadialGlow(ctx, 560, by, 360, 0.16 * easeOutCubic(prog(t, 1.4, 1.0)) * (0.8 + 0.2 * Math.sin(t * 2.2)));
    S.drawBrain(ctx, 560, by, bs, { progress: easeInOutCubic(prog(t, 0.8, 1.4)), width: 5.5 });
    S.drawBrainSparks(ctx, 560, by, bs, t, prog(t, 2.0, 0.6));
    S.drawClock(ctx, 250, 600, 56, Math.max(0, t - 1.0), { progress: easeInOutCubic(prog(t, 1.0, 0.9)), width: 4 });
    // tiny "zz" stillness marks: dots fading in and out above the clock
    if (t > 3) S.drawThoughtDots(ctx, 228, 500, t, { alpha: 0.5 * prog(t, 3, 0.6), r: 4 });

    // right: the doer — starts walking
    const w = s2walk.at(t);
    const pose = s2walk.pose(t);
    const xr = t < 3.2 ? 1120 : t > 7.9 ? 1730 : w.x;
    const JR = S.drawPerson(ctx, xr, G, 270, pose, { progress: easeInOutCubic(prog(t, 2.4, 0.8)) });
    // speed lines behind while walking
    if (w.amt > 0.05) {
      const lines = [0, 1, 2].map((i) => {
        const yy = JR.hip[1] - 120 + i * 45;
        const len = 70 - i * 15;
        return [[xr - 70 - len, yy], [xr - 70, yy]];
      });
      E.drawPolys(ctx, lines, { width: 3.5, alpha: 0.55 * w.amt });
    }
    // forward arrow above the doer
    S.drawArrow(ctx, [[1190, 545], [1420, 515], [1680, 545]], { progress: easeInOutCubic(prog(t, 3.5, 1.4)), width: 4.5, alpha: 0.9 });

    E.drawMessageBox(ctx, 'SMART ≠ SUCCESS', 960, 185, t - 5.2, { size: 66 });
  },
  sfx() {
    const ticks = [2, 3, 4, 5].map((s) => [1.0 + s, 'tick', -17]);
    return [
      [0.25, 'whoosh', -19],
      [1.4, 'impact', -14],
      ...ticks,
      [2.45, 'whoosh', -19],
      ...stepCues(s2walk.strikes(), -14),
      [5.15, 'whoosh', -15],
      [5.25, 'hit', -5],
    ];
  },
};

// ------------------------------------------------------------------ Scene 3 – KNOWLEDGE VS ACTION
const s3a = walkSeg({ t0: 1.4, t1: 3.15, x0: 1100, x1: 1372, h: 250 });
const s3b = walkSeg({ t0: 4.95, t1: 6.6, x0: 1452, x1: 1715, h: 250 });
const BOOKS = [
  // [x, y(bottom of stack offset index), w, rot, appearTime]
  [300, 0, 160, -0.03, 0.7], [300, 1, 140, 0.04, 1.05], [300, 2, 150, -0.02, 1.4], [300, 3, 120, 0.05, 4.4],
  [700, 0, 150, 0.02, 0.9], [700, 1, 130, -0.05, 1.25], [700, 2, 140, 0.03, 4.9], [700, 3, 110, -0.02, 5.6],
];
const PLANS = [[330, 420, -0.18, 2.0], [505, 335, 0.06, 2.5], [690, 430, 0.16, 3.0]];
export const knowAct = {
  id: 'know-act',
  title: 'KNOWLEDGE VS ACTION',
  dur: 10.0,
  bg: { focusX: 960, focusY: 600 },
  cam: (t) => ({ zoom: 1.0 + 0.03 * easeInOutSine(clamp(t / 10)), x: 0, y: 0 }),
  draw(ctx, t) {
    const G = 900;
    // divider made of dots
    const pd = easeInOutCubic(prog(t, 0.1, 1.0));
    ctx.save();
    ctx.fillStyle = '#fff';
    const ga = ctx.globalAlpha;
    for (let y = 300; y <= 960; y += 22) {
      if ((y - 300) / 660 > pd) break;
      ctx.globalAlpha = ga * 0.35;
      ctx.beginPath();
      ctx.arc(960, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    E.drawPolys(ctx, [[[150, G], [860, G]], [[1060, G], [1860, G]]], { progress: easeInOutCubic(prog(t, 0.1, 1.0)), width: 3, alpha: 0.45 });

    // ---- left: stuck in books and plans
    const J = S.drawPerson(ctx, 500, G, 255, S.POSE_THINK, { progress: easeInOutCubic(prog(t, 0.2, 0.9)) });
    BOOKS.forEach(([x, i, w, rot, ta]) => {
      const p = prog(t, ta, 0.4);
      if (p <= 0) return;
      const yRest = G - 18 - i * 36;
      const y = lerp(yRest - 160, yRest, easeOutBack(p, 1.2));
      S.drawStackBook(ctx, x, y, w, 34, { rot, alpha: clamp(p * 3), width: 3.5 });
    });
    PLANS.forEach(([x, y, rot, ta], i) => {
      const p = easeOutCubic(prog(t, ta, 0.6));
      S.drawPlanSheet(ctx, x, y + floatY(t, 7, 1.2, i * 2) + (1 - p) * 30, 92, 118, { rot: rot + 0.03 * Math.sin(t + i), progress: p, alpha: p, width: 3.2 });
    });
    if (t > 1.6) S.drawThoughtDots(ctx, J.head[0] + 40, J.head[1] - 55, t, { alpha: prog(t, 1.6, 0.5), r: 6 });

    // ---- right: acts, falls, gets up, continues
    S.drawRock(ctx, 1420, G, 58, { progress: easeOutCubic(prog(t, 0.6, 0.5)), width: 4 });
    S.drawFlag(ctx, 1795, G, 170, t, { progress: easeInOutCubic(prog(t, 0.9, 0.8)), width: 4 });

    let x = 1100, pose = S.POSE_STAND, rot = 0;
    const pivot = [38, 0];
    if (t < 3.15) {
      const w = s3a.at(t); x = t < 1.4 ? 1100 : w.x; pose = s3a.pose(t);
    } else if (t < 3.5) { // falling
      const p = prog(t, 3.15, 0.35);
      x = 1372; rot = 1.38 * easeInCubic(p); pose = S.mixPose(s3a.pose(3.15), POSE_FALL, easeOutCubic(p));
    } else if (t < 4.05) { // on the ground, little bounce
      const p = prog(t, 3.5, 0.55);
      x = 1372; rot = 1.38 - 0.05 * Math.sin(Math.PI * clamp(p * 2)) * (1 - p); pose = POSE_FALL;
    } else if (t < 4.85) { // getting up
      const p = easeInOutCubic(prog(t, 4.05, 0.8));
      x = lerp(1372, 1452, p); rot = 1.38 * (1 - p); pose = S.mixPose(S.POSE_KNEEL, S.POSE_STAND, p);
    } else {
      const w = s3b.at(t); x = t > 6.6 ? 1715 : w.x; pose = s3b.pose(t);
    }
    // footprints trail (dots) behind
    ctx.save();
    ctx.fillStyle = '#fff';
    const ga2 = ctx.globalAlpha;
    for (let fx = 1120; fx < x - 30; fx += 34) {
      if (Math.abs(fx - 1420) < 40) continue;
      ctx.globalAlpha = ga2 * 0.4;
      ctx.beginPath();
      ctx.arc(fx, G + 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    const JR = S.drawPerson(ctx, x, G, 250, pose, { progress: easeInOutCubic(prog(t, 0.6, 0.8)), rot, pivot });
    // "now he knows": a light bulb over the doer
    const pbulb = prog(t, 6.75, 0.5);
    if (pbulb > 0) {
      const s = easeOutBack(pbulb, 1.8);
      ctx.save();
      ctx.translate(JR.head[0], JR.head[1] - 95);
      ctx.scale(s, s);
      E.drawRadialGlow(ctx, 0, 0, 120, 0.18 * pbulb);
      S.drawBulb(ctx, 0, 0, 30, { width: 4, rays: easeOutCubic(prog(t, 7.0, 0.5)), time: t });
      ctx.restore();
    }
    E.drawMessageBox(ctx, 'ACT → THEN KNOW', 960, 175, t - 7.2, { size: 64 });
  },
  sfx() {
    return [
      [0.15, 'whoosh', -20],
      ...BOOKS.map(([, , , , ta], i) => [ta + 0.3, 'pages', -15 - (i % 2) * 2]),
      ...PLANS.map(([, , , ta]) => [ta, 'whoosh', -22]),
      ...stepCues(s3a.strikes(), -14),
      [3.4, 'stumble', -8],
      [4.1, 'whoosh', -22],
      ...stepCues(s3b.strikes(), -14),
      [6.75, 'click', -12],
      [6.8, 'coin', -20],
      [7.15, 'whoosh', -15],
      [7.25, 'hit', -5],
    ];
  },
};

// ------------------------------------------------------------------ Scene 4 – THE RESULT
const ST = { x0: 380, y0: 940, n: 5, w: 215, h: 108 };
const climb = walkSeg({ t0: 1.6, t1: 6.8, x0: 250, x1: 1345, h: 220 });
function stairY(x) {
  let y = ST.y0;
  for (let i = 0; i < ST.n; i++) {
    const xr = ST.x0 + i * ST.w;
    const k = clamp((x - (xr - 40)) / 80);
    y -= ST.h * easeInOutCubic(k) + ST.h * 0.35 * Math.sin(Math.PI * k);
  }
  return y;
}
function timeAtX(xTarget) {
  for (let t = climb.at(1.6).x >= xTarget ? 1.6 : 1.6; t <= 6.8; t += 1 / 240) if (climb.at(t).x >= xTarget) return t;
  return 6.8;
}
const COINS = [1, 3].map((i) => {
  const x = ST.x0 + (i + 0.55) * ST.w;
  return { x, y: ST.y0 - (i + 1) * ST.h - 290, t: timeAtX(x - 70) };
});
const BULB_T = timeAtX(ST.x0 + 2.35 * ST.w);
export const result = {
  id: 'result',
  title: 'THE RESULT',
  dur: 9.6,
  bg: { focusX: 1100, focusY: 520 },
  cam: (t) => ({ zoom: 1.0 + 0.04 * easeInOutSine(clamp(t / 9.6)), x: 0, y: 35 * easeInOutCubic(prog(t, 1.6, 5.5)) }),
  draw(ctx, t) {
    const { x0, y0, n, w, h } = ST;
    const stairs = S.stairsPoly(x0, y0, n, w, h);
    stairs.push([x0 + n * w, y0], [x0 - w * 0.6, y0]);
    E.drawPolys(ctx, [stairs], { progress: easeInOutCubic(prog(t, 0.15, 1.4)), width: 4.5, mode: 'sequential' });
    // dotted fill pattern inside stairs (subtle)
    E.drawDotPatch(ctx, x0 + w * 4 + 30, y0 - h * 4 + 30, 7, 14, 22, 0.12 * prog(t, 1.2, 1), t);

    S.drawGraph(ctx, 1525, 940, 320, 300, { progress: easeInOutCubic(prog(t, 3.0, 3.6)), width: 4 });

    const top = { x: x0 + n * w - 45, y: y0 - n * h };
    E.drawRadialGlow(ctx, top.x - 60, top.y - 80, 420, 0.14 * easeOutCubic(prog(t, 6.6, 1.0)));
    S.drawFlag(ctx, top.x, top.y, 150, t, { progress: easeInOutCubic(prog(t, 6.3, 0.8)), width: 4.5 });

    // climber
    const c = climb.at(t);
    const x = t < 1.6 ? 250 : t > 6.8 ? 1345 : c.x;
    let pose = climb.pose(t);
    if (t > 6.85) pose = S.mixPose(S.POSE_STAND, S.POSE_CHEER, easeOutBack(prog(t, 6.85, 0.5), 1.4));
    const J = S.drawPerson(ctx, x, stairY(x), 220, pose, { progress: easeInOutCubic(prog(t, 1.0, 0.6)) });

    // coins collected along the way
    COINS.forEach((cn) => {
      const p = prog(t, cn.t - 0.25, 0.35);
      if (p <= 0) return;
      const fl = prog(t, cn.t + 0.25, 1.3);
      const yy = cn.y - easeOutCubic(fl) * 90;
      S.drawCoin(ctx, cn.x, yy, 40, { scale: easeOutBack(p, 2), alpha: 1 - fl, width: 4 });
    });
    // bulb (opportunity) follows the climber after step 2
    const pb = prog(t, BULB_T, 0.45);
    if (pb > 0) {
      const s = easeOutBack(pb, 1.8);
      ctx.save();
      ctx.translate(J.head[0] + 6, J.head[1] - 92);
      ctx.scale(s * 0.9, s * 0.9);
      S.drawBulb(ctx, 0, 0, 28, { width: 4, rays: easeOutCubic(prog(t, BULB_T + 0.25, 0.4)), time: t });
      ctx.restore();
    }
    // money appears at the summit
    [[-1, 0.0], [0, 0.15], [1, 0.3]].forEach(([k, d]) => {
      const p = prog(t, 7.0 + d, 0.4);
      if (p <= 0) return;
      S.drawBill(ctx, 1660 + k * 26, 300 - k * 34 + floatY(t, 5, 1.4, k), 150, 74, { rot: -0.12 + k * 0.1, progress: easeOutCubic(p), alpha: clamp(p * 2), width: 3.5 });
    });

    E.drawMessageBox(ctx, 'ACTION CREATES RESULTS', 640, 215, t - 7.4, { size: 58 });
  },
  sfx() {
    return [
      [0.2, 'whoosh', -18],
      [1.0, 'whoosh', -21],
      ...stepCues(climb.strikes(), -15),
      ...COINS.map((cn) => [cn.t - 0.2, 'coin', -11]),
      [BULB_T, 'click', -12],
      [3.0, 'whoosh', -22],
      [5.9, 'riser', -14],
      [6.95, 'impact', -13],
      [7.0, 'coin', -15], [7.15, 'coin', -18], [7.3, 'coin', -20],
      [7.35, 'whoosh', -15],
      [7.45, 'hit', -4],
    ];
  },
};

export const ALL = { hook, contrast, knowAct, result };
