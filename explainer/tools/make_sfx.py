#!/usr/bin/env python3
"""Build the sound-effect library used by the mixer.

- Slices / trims / peak-normalises the ElevenLabs-generated takes in assets/sfx/elevenlabs/
- Synthesises LOCAL stand-ins (clearly named *_local.wav) for any sound whose ElevenLabs
  generation is missing, so the pipeline always runs. Replace them by dropping an ElevenLabs
  take with the same base name into assets/sfx/elevenlabs/ and re-running this script.

Output: assets/sfx/lib/<name>.wav  (48 kHz, stereo, 16-bit)
"""
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets', 'sfx', 'elevenlabs')
LIB = os.path.join(ROOT, 'assets', 'sfx', 'lib')
os.makedirs(LIB, exist_ok=True)
rng = np.random.default_rng(7)


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def write(name, x, peak_db=-1.0):
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    p = np.max(np.abs(x)) or 1.0
    x = x / p * (10 ** (peak_db / 20))
    pcm = (np.clip(x, -1, 1) * 32767).astype('<i2').tobytes()
    out = os.path.join(LIB, name + '.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', out],
                   input=pcm, check=True)
    return out


def fade(x, fin=0.003, fout=0.05):
    n = len(x)
    a, b = int(fin * SR), int(fout * SR)
    env = np.ones(n)
    if a: env[:a] = np.linspace(0, 1, a)
    if b: env[-b:] *= np.linspace(1, 0, b)
    return x * env[:, None] if x.ndim == 2 else x * env


def cut(x, t0, t1):
    return x[int(t0 * SR):int(t1 * SR)]


def lp(x, f, order=2):
    return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x, axis=0)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x, axis=0)


def bp(x, f0, f1, order=2):
    return sosfilt(butter(order, [f0, f1], 'band', fs=SR, output='sos'), x, axis=0)


def reverb(x, secs=1.6, mix=0.25, seed=1):
    n = int(secs * SR)
    r = np.random.default_rng(seed)
    t = np.arange(n) / SR
    ir_l = r.standard_normal(n) * np.exp(-t * 5.5 / secs)
    ir_r = r.standard_normal(n) * np.exp(-t * 5.5 / secs)
    ir_l, ir_r = lp(ir_l, 5000), lp(ir_r, 5000)
    mono = x if x.ndim == 1 else x.mean(axis=1)
    wl = fftconvolve(mono, ir_l)[: len(mono) + n]
    wr = fftconvolve(mono, ir_r)[: len(mono) + n]
    wet = np.stack([wl, wr], axis=1)
    wet /= np.max(np.abs(wet)) or 1
    dry = np.zeros_like(wet)
    dry[: len(mono)] = np.stack([mono, mono], axis=1) / (np.max(np.abs(mono)) or 1)
    return dry * (1 - mix) + wet * mix


def sweep(f0, f1, dur, tau):
    t = np.arange(int(dur * SR)) / SR
    f = f1 + (f0 - f1) * np.exp(-t / (dur / 4))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t / tau)


manifest = {}

# ---------------- ElevenLabs takes ----------------
def el(name):
    p = os.path.join(SRC, name + '.mp3')
    return decode(p) if os.path.exists(p) else None

x = el('click')
if x is not None:
    write('click', fade(cut(x, 0, 0.22), 0.001, 0.04)); manifest['click'] = 'elevenlabs'
x = el('whoosh')
if x is not None:
    write('whoosh', fade(cut(x, 0.12, 1.75), 0.005, 0.25)); manifest['whoosh'] = 'elevenlabs'
x = el('tick_a')
if x is not None:
    write('tick', fade(cut(x, 0, 0.30), 0.001, 0.05)); manifest['tick'] = 'elevenlabs'
x = el('pages')
if x is not None:
    write('pages', fade(x, 0.005, 0.2)); manifest['pages'] = 'elevenlabs'
x = el('riser')
if x is not None:
    write('riser', fade(x, 0.01, 0.12)); manifest['riser'] = 'elevenlabs'
x = el('coin')
if x is not None:
    write('coin', fade(cut(x, 0, 0.75), 0.001, 0.2)); manifest['coin'] = 'elevenlabs'
x = el('steps_b')
if x is not None:
    for i, (a, b) in enumerate([(0.0, 0.20), (0.47, 0.74), (1.08, 1.34), (1.58, 1.84)]):
        write(f'step{i + 1}', fade(cut(x, a, b), 0.002, 0.06))
    manifest['step1-4'] = 'elevenlabs'

# ---------------- optional ElevenLabs takes; fall back to local synthesis ----------------
def have(name):
    return os.path.exists(os.path.join(SRC, name + '.mp3'))

# soft cinematic impact (brain reveal)
if have('impact'):
    write('impact', fade(el('impact'), 0.002, 0.4)); manifest['impact'] = 'elevenlabs'
else:
    body = sweep(95, 36, 2.6, 0.7)
    air = bp(rng.standard_normal(len(body)), 2500, 9000) * np.exp(-np.arange(len(body)) / SR / 0.9) * 0.12
    air *= np.minimum(1, np.arange(len(body)) / (0.08 * SR))
    write('impact', fade(reverb(body + air, 2.0, 0.3), 0.001, 0.6)); manifest['impact'] = 'local-synth'

# deep cinematic hit (key statements)
if have('hit'):
    write('hit', fade(el('hit'), 0.002, 0.4)); manifest['hit'] = 'elevenlabs'
else:
    n = int(2.8 * SR)
    t = np.arange(n) / SR
    sub = sweep(70, 30, 2.8, 0.9)
    thump = np.sin(2 * np.pi * 115 * t) * np.exp(-t / 0.09) * 0.6
    crack = lp(rng.standard_normal(n), 1800) * np.exp(-t / 0.03) * 0.5
    write('hit', fade(reverb(sub + thump + crack, 2.4, 0.35, seed=3), 0.0005, 0.8)); manifest['hit'] = 'local-synth'

# stumble / body fall
if have('stumble'):
    write('stumble', fade(el('stumble'), 0.002, 0.15)); manifest['stumble'] = 'elevenlabs'
else:
    n = int(0.9 * SR)
    t = np.arange(n) / SR
    def thud(at, amp, f0):
        y = np.zeros(n)
        k = int(at * SR)
        tt = t[: n - k]
        y[k:] = (np.sin(2 * np.pi * (f0 - 30 * tt / 0.2) * tt) * np.exp(-tt / 0.07)
                 + lp(rng.standard_normal(n - k), 900) * np.exp(-tt / 0.025) * 0.8) * amp
        return y
    shuffle = bp(rng.standard_normal(n), 300, 3000) * np.exp(-((t - 0.05) ** 2) / 0.002) * 0.25
    write('stumble', fade(reverb(thud(0.09, 1.0, 95) + thud(0.24, 0.55, 80) + shuffle, 0.6, 0.15, seed=5), 0.002, 0.2))
    manifest['stumble'] = 'local-synth'

# ambience bed
if have('ambience'):
    write('ambience', el('ambience'), peak_db=-6); manifest['ambience'] = 'elevenlabs'
else:
    dur = 60.0
    n = int(dur * SR)
    t = np.arange(n) / SR
    pad = np.zeros((n, 2))
    for f, a, rate in [(55, 0.5, 0.05), (82.41, 0.32, 0.07), (110, 0.22, 0.031), (164.81, 0.10, 0.043), (220, 0.05, 0.023)]:
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * rate * t + f)
        pad[:, 0] += a * lfo * np.sin(2 * np.pi * f * t)
        pad[:, 1] += a * lfo * np.sin(2 * np.pi * (f * 1.003) * t + 0.5)
    noise = lp(rng.standard_normal((n, 2)), 380, 2) * 0.35
    air = bp(rng.standard_normal((n, 2)), 2000, 6000) * 0.012
    bed = pad + noise + air
    write('ambience', fade(bed, 2.0, 2.0), peak_db=-6); manifest['ambience'] = 'local-synth'

with open(os.path.join(LIB, 'manifest.json'), 'w') as f:
    json.dump(manifest, f, indent=2)
print(json.dumps(manifest, indent=2))
