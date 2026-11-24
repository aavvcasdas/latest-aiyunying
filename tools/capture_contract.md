# Deterministic frame-capture contract

Use this contract for new browser MV pages. Legacy `__mv.render` / `__mvRender` /
`__seek` hooks remain readable by `tools/shoot_vite_mv.mjs`,
`tools/shoot_opus_mv.mjs` and the canonical adapter, but new delivery work should
expose `window.__FILM__`.

## Interface

```ts
interface FilmAdapter {
  ready: () => boolean;
  duration: number;   // seconds
  fps: number;
  render: (t: number) => void | string; // render exactly time t; string return is ignored
  dispose?: () => void;
}
```

`render(t)` must be a pure function of `t`: no `Date.now()`, `Math.random()`, hidden
counters, audio-clock corrections, or reliance on previously rendered frames. The
page may keep a real-time preview loop, but the capture script saves the real rAF,
freezes the page loop, and then renders exact frames.

## Capture

```bash
npm run capture:film -- --dist <构建目录> --out /tmp/frames --dur 30 --fps 30 --w 1280 --h 720
npm run capture:film -- --dist <构建目录> --out /tmp/frames --dur 30 --format jpeg --quality 95
```

`tools/shoot_film_adapter.mjs` defaults to lossless PNG frames. Pass
`--format jpeg --quality 95` only for a quick compatibility check. Encode frames
with `python3 tools/encode_frames.py --frames /tmp/frames --audio <音轨> --out <成片.mp4>`;
that script discovers PNG or JPEG sequences and uses the same defaults.

## Shared defaults

`tools/render_defaults.json` is the single source for JS and Python:

| key | value | why |
| --- | --- | --- |
| `imageFormat` | `png` | no JPEG generation before H.264 |
| `crf` | `16` | higher-quality H.264 master |
| `maxrate` | `12000k` | enough headroom for 1080p |
| `visualQuality.bloomScale` | `0.45` | less halo on ~90px sprites |
| `visualQuality.bloomThreshold` | `0.95` | keep white aprons from burning out |
| `visualQuality.chromaticBaseline` | `0` | no permanent red/blue fringe |
| `visualQuality.grain` | `0` | no synthetic grain before encoding |
| `visualQuality.supersample` | `2` | 2× render target, then downsample |
| `visualQuality.atlasFilter` | `nearest` | preserve pixel-art edges |
| `visualQuality.pixelSmoothing` | `0.28` | one-pixel master_soft coverage + gentle cross-sample blend for 本鲸 only |

The after side of `docs/quality_comparison/character_quality_comparison.png` is
computed from these values; the before side simulates the old JPEG + bloom +
chromatic chain.

## Human sign-off

Automated checks cannot judge framing, occlusion, taste or lyric sync. After
rendering a real frame sequence, run `npm run qa:motion -- --frames /tmp/frames`
and record a human review in `docs/quality_comparison/human_sign_off.md`.
