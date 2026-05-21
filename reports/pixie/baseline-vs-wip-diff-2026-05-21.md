# Pixie Baseline vs WIP Diff — 2026-05-21

**Baseline root:** `pixie/original` (immutable origin/main snapshot)
**WIP root:** `public/pixie` (current dirty working tree)
**Scope:** canonical stage assets only (`pixie-<species>-stage-<N>.png`). Preview sheets and `.gitkeep` excluded.

## Totals

- Compared pairs: **144**
- Changed (not byte-identical): **72**
- Unchanged (byte-identical): **72**
- Only in baseline: 0
- Only in WIP: 0
- Species touched: **12** / 24
- Regressions flagged: **0**

## Species touched

| Species | Stages changed | Net Δ bytes | Mean pixel MAD |
|---|---|---|---|
| `angel` | 1, 2, 3, 4, 5, 6 | +111,083 | 23.97 |
| `banana` | 1, 2, 3, 4, 5, 6 | +25,191 | 20.62 |
| `caffe` | 1, 2, 3, 4, 5, 6 | +48,493 | 13.58 |
| `devil` | 1, 2, 3, 4, 5, 6 | +95,699 | 15.80 |
| `fuoco` | 1, 2, 3, 4, 5, 6 | +46,974 | 13.34 |
| `hologram` | 1, 2, 3, 4, 5, 6 | -3,980 | 19.83 |
| `ice` | 1, 2, 3, 4, 5, 6 | +42,654 | 24.46 |
| `leaf` | 1, 2, 3, 4, 5, 6 | +5,694 | 22.01 |
| `moonlight` | 1, 2, 3, 4, 5, 6 | +33,999 | 25.76 |
| `scintille` | 1, 2, 3, 4, 5, 6 | +21,211 | 14.62 |
| `triste` | 1, 2, 3, 4, 5, 6 | +29,559 | 16.42 |
| `voidcore` | 1, 2, 3, 4, 5, 6 | +1,031 | 18.44 |

## Species fully unchanged (all 6 stages byte-identical)

- `blip`
- `crown`
- `diamond`
- `galaxy`
- `heart`
- `momo`
- `orbit`
- `overseer`
- `robot`
- `shade`
- `spark`
- `void`

## Top 15 changed files by absolute size delta

| Species | Stage | Baseline B | WIP B | Δ bytes | Pixel MAD |
|---|---|---|---|---|---|
| `moonlight` | 6 | 47,204 | 78,626 | +31,422 | 43.97 |
| `angel` | 5 | 18,408 | 42,576 | +24,168 | 32.28 |
| `leaf` | 6 | 56,701 | 80,777 | +24,076 | 36.70 |
| `angel` | 6 | 19,020 | 42,576 | +23,556 | 31.96 |
| `ice` | 5 | 39,232 | 61,064 | +21,832 | 33.91 |
| `caffe` | 5 | 28,037 | 49,479 | +21,442 | 17.36 |
| `angel` | 4 | 21,172 | 42,576 | +21,404 | 29.85 |
| `fuoco` | 5 | 30,113 | 51,502 | +21,389 | 19.03 |
| `devil` | 5 | 21,951 | 43,283 | +21,332 | 20.97 |
| `devil` | 6 | 22,085 | 43,283 | +21,198 | 21.35 |
| `angel` | 3 | 15,930 | 36,820 | +20,890 | 24.75 |
| `ice` | 6 | 40,673 | 61,064 | +20,391 | 31.70 |
| `triste` | 5 | 31,900 | 52,146 | +20,246 | 21.02 |
| `devil` | 4 | 23,424 | 43,283 | +19,859 | 19.14 |
| `fuoco` | 6 | 33,099 | 51,502 | +18,403 | 18.32 |

## Top 15 changed files by pixel MAD (visual divergence)

| Species | Stage | Pixel MAD | Δ bytes | Mode B→W |
|---|---|---|---|---|
| `moonlight` | 6 | 43.97 | +31,422 | RGB→RGB |
| `leaf` | 6 | 36.70 | +24,076 | RGB→RGB |
| `ice` | 5 | 33.91 | +21,832 | RGB→RGB |
| `moonlight` | 5 | 33.31 | +16,997 | RGB→RGB |
| `angel` | 5 | 32.28 | +24,168 | RGB→RGB |
| `angel` | 6 | 31.96 | +23,556 | RGB→RGB |
| `ice` | 6 | 31.70 | +20,391 | RGB→RGB |
| `angel` | 4 | 29.85 | +21,404 | RGB→RGB |
| `hologram` | 6 | 29.56 | +15,013 | RGB→RGB |
| `voidcore` | 6 | 28.85 | +15,047 | RGB→RGB |
| `voidcore` | 5 | 27.78 | +17,527 | RGB→RGB |
| `leaf` | 5 | 27.04 | +8,931 | RGB→RGB |
| `banana` | 5 | 26.75 | +17,928 | RGB→RGB |
| `angel` | 3 | 24.75 | +20,890 | RGB→RGB |
| `ice` | 4 | 24.27 | +7,850 | RGB→RGB |

## Regressions

None.

## Interpretation guide

- **Byte-identical** = no change at all on that file in WIP.
- **Pixel MAD** = mean absolute per-channel difference (0-255). Low values (<2) usually = re-encode with no visible change. Mid (2-15) = noticeable retouch / color shift. High (>15) = significant repaint or new content.
- **Δ bytes** = WIP size minus baseline size. Negative = WIP smaller (likely re-compressed / lower-quality encode). Positive = WIP larger.
- A regression entry means the WIP file lost something the baseline had (size, mode, or alpha). The 138/144 RGB-only baseline state is a separate finding documented in `audit-2026-05-21.md`; it is NOT a regression introduced by the WIP.
