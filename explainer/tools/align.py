#!/usr/bin/env python3
"""Sentence-level timing from the voiceover (the master clock).

Splits the script into sentences, finds the pauses in the MP3, and snaps each sentence boundary to the
pause nearest to where the text says it should fall (by cumulative character count over speech time).
Word times inside a sentence are estimated proportionally. If a word-level transcript JSON from
ElevenLabs Scribe is supplied (--words), those exact timestamps are used instead.

usage: align.py voiceover.mp3 script.txt [--words scribe.json] [--out out/alignment.json]
"""
import argparse
import json
import re
import subprocess


def sentences(text):
    text = re.sub(r'\s+', ' ', text).strip()
    parts = re.split(r'(?<=[.!?…])["”’)]?\s+(?=[^\s])', text)
    return [p.strip() for p in parts if p.strip()]


def duration(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                       capture_output=True, text=True, check=True)
    return float(r.stdout.strip())


def silences(path, noise_db=-35, min_d=0.22):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', f'silencedetect=n={noise_db}dB:d={min_d}', '-f', 'null', '-'],
                       capture_output=True, text=True)
    out, start = [], None
    for line in r.stderr.splitlines():
        m = re.search(r'silence_start: ([\d.]+)', line)
        if m:
            start = float(m.group(1))
        m = re.search(r'silence_end: ([\d.]+)', line)
        if m and start is not None:
            out.append((start, float(m.group(1))))
            start = None
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio')
    ap.add_argument('script')
    ap.add_argument('--words', help='ElevenLabs Scribe JSON with words[{text,start,end}]')
    ap.add_argument('--out', default='out/alignment.json')
    a = ap.parse_args()

    sents = sentences(open(a.script, encoding='utf-8').read())
    total = duration(a.audio)
    sil = silences(a.audio)
    lead = sil[0][1] if sil and sil[0][0] <= 0.05 else 0.0
    tail = sil[-1][0] if sil and sil[-1][1] >= total - 0.05 else total
    gaps = [s for s in sil if s[0] > lead + 0.05 and s[1] < tail - 0.05]  # interior pauses

    # map "fraction of characters spoken" -> time, measured over speech only (pauses removed)
    speech = []
    t = lead
    for g0, g1 in gaps:
        speech.append((t, g0)); t = g1
    speech.append((t, tail))
    speech_len = sum(b - a_ for a_, b in speech)

    def frac_to_time(f):
        target = f * speech_len
        for a_, b in speech:
            if target <= b - a_:
                return a_ + target
            target -= b - a_
        return tail

    chars = [len(s) for s in sents]
    cum = 0
    bounds = []
    for c in chars[:-1]:
        cum += c
        bounds.append(frac_to_time(cum / sum(chars)))

    # snap each expected boundary to the nearest unused pause midpoint (keeping order)
    mids = [((g0 + g1) / 2, g0, g1) for g0, g1 in gaps]
    used = -1
    snapped = []
    for b in bounds:
        best = None
        for j in range(used + 1, len(mids)):
            d = abs(mids[j][0] - b)
            if best is None or d < best[0]:
                best = (d, j)
        if best and best[0] < 1.2:
            used = best[1]
            snapped.append((mids[used][1], mids[used][2]))
        else:
            snapped.append((b, b))

    words_json = None
    if a.words:
        wj = json.load(open(a.words))
        words_json = [w for w in wj.get('words', wj) if w.get('type', 'word') == 'word']

    out = []
    starts = [lead] + [s[1] for s in snapped]
    ends = [s[0] for s in snapped] + [tail]
    for i, s in enumerate(sents):
        st, en = starts[i], ends[i]
        toks = s.split()
        if words_json:
            ws = [{'w': w['text'], 't': round(w['start'], 3)} for w in words_json if st - 0.15 <= w['start'] < en + 0.05]
        else:
            L = sum(len(x) + 1 for x in toks)
            acc, ws = 0, []
            for x in toks:
                ws.append({'w': x, 't': round(st + (en - st) * acc / L, 3)})
                acc += len(x) + 1
        out.append({'i': i + 1, 'text': s, 'start': round(st, 3), 'end': round(en, 3), 'words': ws})

    json.dump({'audio': a.audio, 'duration': total, 'sentences': out}, open(a.out, 'w'), indent=2, ensure_ascii=False)
    for s in out:
        print(f"{s['i']:>2}  {s['start']:7.2f} – {s['end']:7.2f}  {s['text'][:70]}")
    print(f'{len(out)} sentences, {len(gaps)} pauses detected -> {a.out}')


if __name__ == '__main__':
    main()
