#!/usr/bin/env python3
"""Mix the soundtrack: timed SFX cues + ambience bed (+ optional voiceover, which is never altered
except for a single static gain to reach broadcast loudness). SFX and ambience duck under the voice.

usage: mix.py --cues out/cues.json --out out/mix.wav [--voice vo.mp3]
"""
import argparse
import json
import os
import subprocess

import numpy as np
from scipy.signal import butter, sosfilt

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LIB = os.path.join(ROOT, 'assets', 'sfx', 'lib')


def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).astype(np.float64)


def db(x):
    return 10 ** (x / 20)


def loudness_lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    for line in reversed(r.stderr.splitlines()):
        line = line.strip()
        if line.startswith('I:'):
            return float(line.split()[1])
    return None


def envelope(x, attack=0.02, release=0.35):
    mono = np.abs(x).mean(axis=1)
    win = int(0.03 * SR)
    rms = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode='same'))
    a, r = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    # one-pole attack/release follower, vectorised in blocks for speed
    out = np.empty_like(rms)
    e = 0.0
    step = 64
    for i in range(0, len(rms), step):
        v = rms[i:i + step].max()
        e = a * e + (1 - a) * v if v > e else r * e + (1 - r) * v
        out[i:i + step] = e
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cues', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--voice')
    ap.add_argument('--voice-lufs', type=float, default=-16.0)
    ap.add_argument('--ambience-db', type=float, default=-25.0)
    a = ap.parse_args()

    data = json.load(open(a.cues))
    total = data['total']
    voice = None
    if a.voice:
        voice = decode(a.voice)
        total = max(total, len(voice) / SR + 0.5)
    n = int(total * SR)

    cache = {}
    sfx = np.zeros((n, 2))
    for c in data['cues']:
        name = c['name']
        if name not in cache:
            cache[name] = decode(os.path.join(LIB, name + '.wav'))
        clip = cache[name] * db(c['gain'])
        i0 = int(c['t'] * SR)
        if i0 >= n:
            continue
        seg = clip[: n - i0]
        sfx[i0:i0 + len(seg)] += seg

    amb = decode(os.path.join(LIB, 'ambience.wav'))
    reps = int(np.ceil(n / len(amb)))
    bed = np.tile(amb, (reps, 1))[:n] * db(a.ambience_db)
    t = np.arange(n) / SR
    bed *= np.minimum(1, t / 2.0)[:, None] * np.minimum(1, (total - t) / 2.5)[:, None]

    music_bus = sfx + bed
    mix = music_bus
    if voice is not None:
        # one static gain to target loudness; the performance itself is untouched
        lufs = loudness_lufs(a.voice)
        g = db(a.voice_lufs - lufs) if lufs is not None else 1.0
        v = np.zeros((n, 2))
        v[: len(voice)] = voice * g
        env = envelope(v)
        thr = db(-38)
        duck = np.where(env > thr, db(-5), 1.0)
        duck = sosfilt(butter(1, 4, 'low', fs=SR, output='sos'), duck)  # smooth gain changes
        mix = v + music_bus * duck[:, None]
        print(f'voice: {lufs:.1f} LUFS -> {a.voice_lufs} LUFS (gain {20*np.log10(g):+.1f} dB)')

    peak = np.max(np.abs(mix))
    ceiling = db(-1.0)
    if peak > ceiling:
        # gentle soft-knee limiting only above the ceiling
        over = np.abs(mix) > ceiling * 0.9
        mix[over] = np.sign(mix[over]) * (ceiling * 0.9 + (ceiling * 0.1) * np.tanh((np.abs(mix[over]) - ceiling * 0.9) / (ceiling * 0.1)))
    pcm = (np.clip(mix, -1, 1) * 32767).astype('<i2').tobytes()
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-', a.out], input=pcm, check=True)
    print(f'mix: {total:.2f} s, {len(data["cues"])} cues, peak {20*np.log10(max(peak,1e-9)):.1f} dBFS -> {a.out}')


if __name__ == '__main__':
    main()
