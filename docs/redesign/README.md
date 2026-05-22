# docs/redesign

Design-direction specs that complement `DESIGN.md`.

`DESIGN.md` (repo root) is the **authoritative source of truth** for tokens, component rules, copy tone, and accessibility constraints. Read it first.

Files in this directory describe **direction** — what we want the product to feel like in a given visual pass — and slice that direction into shippable sprints. They do not replace `DESIGN.md`. When a direction spec and `DESIGN.md` disagree, `DESIGN.md` wins.

## Files

| File | What it is | Status |
|---|---|---|
| `disciplined-neon-spec.md` | Visual discipline pass for the home surface (S1), with later sprints for Play/Results (S2), OG (S3), Profile/share (S4), and optional site-wide orb cleanup | Draft 0.1 — PM review pending |

## How to use

1. Read the spec.
2. PM either approves, edits, or rejects.
3. If approved, the spec is referenced by name in the implementation sprint prompt (`SPRINT: <SPEC>-S1-01` etc.).
4. The implementation sprint touches code; the spec stays read-only documentation that future sessions can use as ground truth.

## Conventions

- One spec per direction.
- Each spec lists explicit scope, hard non-goals, responsive targets, and a numbered sprint sequence (S1, S2, …).
- Each spec ends with an "Open PM decisions" section so a future session can pick it up without losing context.
- Specs do not contain working code. Code lives in the source tree under `app/`, `components/`, `lib/`. Specs describe intent, constraints, and verification.
- Updates bump the `version` field in the YAML front matter and append a one-line status note in the spec's own §9.
