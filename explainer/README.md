# Minimalist Animated Explainer

A code-driven renderer for 1920×1080 black-and-white explainer videos. It draws white line-art on a pure black background, with soft glow, dotted background textures, simple characters and outlined uppercase message boxes. The voiceover MP3 is the master clock: every scene and sound effect is placed on its timeline.

## Status

| Input | Status |
|---|---|
| Voiceover MP3 | **missing**: not received in this session |
| Script | **missing** |
| 2 reference screenshots | **missing** |
| ElevenLabs sound effects | 7 of 11 generated (see below) |

Because the voiceover and script were missing, `deliverables/explainer_style_draft.mp4` is a **style draft** of the four example scenes from the brief. It has sound effects and ambience but **no voiceover**, and its timing is a placeholder until the MP3 arrives.

## Draft storyboard (`deliverables/explainer_style_draft.mp4`, 38 s)

| Time | Scene | Visual | On-screen text | Sound |
|---|---|---|---|---|
| 0.0–9.0 | 1 · The hook | A glowing brain draws itself with a flash. A dotted halo and neural sparks appear. Labels pop in around it. A graduate appears below, and the cap drops onto their head. | SMARTEST · A+ · A+ · IQ 160 | impact, 4 clicks, whoosh, click |
| 9.0–17.6 | 2 · The contrast | Left: a person with a huge glowing brain stands still beside a ticking clock. Right: a simple person starts walking, with speed lines and a forward arrow. | SMART ≠ SUCCESS | ticks synced to the clock hand, footsteps on every foot-strike, deep hit |
| 17.6–27.6 | 3 · Knowledge vs action | Split screen. Left: a thinker buried in growing book stacks and floating plans. Right: a doer walks, trips on a rock, falls, gets up and reaches the flag; a light bulb appears ("now he knows"). | ACT → THEN KNOW | page flips per book, footsteps, stumble, click, hit |
| 27.6–37.2 | 4 · The result | The person climbs a staircase. Coins pop as they pass, a bulb appears over their head and a rising graph draws. At the top: flag, cheer, money. | ACTION CREATES RESULTS | footsteps per step, coin chimes, riser, impact, hit |

## Sound effects

| Sound | Source |
|---|---|
| whoosh, click, tick, pages, footsteps (4 single steps), riser, coin | **ElevenLabs Sound Effects v2**, generated for this video ([flow](https://elevenlabs.io/app/flows/R1yjaQQSBgdP6Lkx4ZyO)) |
| impact, deep hit, stumble, ambience bed | **Local synthesis** (stand-ins). The ElevenLabs free tier was at capacity, so these takes did not start and were not charged. |

To replace a stand-in, put an ElevenLabs take named `impact.mp3`, `hit.mp3`, `stumble.mp3` or `ambience.mp3` in `assets/sfx/elevenlabs/` and run `npm run sfx`. `assets/sfx/lib/manifest.json` records where each sound came from.

Mix rules (`tools/mix.py`):
- The voiceover is never edited; it only gets one static gain to reach −16 LUFS.
- Sound effects sit at −5 to −22 dB.
- Ambience sits at −25 dB.
- Sound effects and ambience duck about 5 dB under speech.
- The output is limited to a −1 dBFS ceiling.

## Finishing the real video

1. Put the files in `explainer/input/` as `voiceover.mp3`, `script.txt`, `ref1.png` and `ref2.png`.
2. Run `python3 tools/align.py input/voiceover.mp3 input/script.txt` to get per-sentence timestamps from the voiceover's pauses. Exact word timestamps from ElevenLabs Scribe can be passed with `--words scribe.json`.
3. Write one scene per sentence in `src/scenes.mjs`, using the illustration library in `src/shapes.mjs`, and pin each scene's `start` to the aligned sentence time in `src/storyboard.mjs`.
4. Run `node render.mjs --voice input/voiceover.mp3 --out explainer_final.mp4`.

## Commands

```bash
npm install                    # @napi-rs/canvas
npm run sfx                    # build assets/sfx/lib from ElevenLabs takes (+ local stand-ins)
node render.mjs --still 14.5   # preview one frame -> out/still_14.50.png
node render.mjs                # full render -> out/explainer.mp4 (4 parallel workers, ~50 s for 38 s)
```

Requirements: Node 18+, Python 3 with numpy and scipy, ffmpeg, and the Inter font (`/usr/share/fonts/opentype/inter`).

## Code map

- `src/engine.mjs`: easing, draw-on poly-lines, two-radius bloom glow, vignette, dotted grids, halftone rings, message boxes.
- `src/shapes.mjs`: brain, posable stick figures (stand, walk cycle, think, fall, kneel, cheer), graduation cap, books, plans, clock, light bulb, coins, bills, arrows, stairs, graph, flag, rock, callouts.
- `src/scenes.mjs`: scene choreography and sound cues. Footstep cues are computed from each walk cycle, so they land on the foot-strikes.
- `src/storyboard.mjs`: master timeline.
- `render.mjs`: parallel frame rendering, then ffmpeg, then mix and mux.
