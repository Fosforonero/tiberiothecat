# SplitVote — Agent Governance

This repo uses **`CLAUDE.md`** as the single source of truth for agent
governance: operating rules, sensitive areas, anti-regression rules,
workflow, definition of done, and HUMAN_ONLY gates.

Codex (and any other AI coding tool that reads `AGENTS.md` by
convention) must follow `CLAUDE.md` exactly, plus any user-provided
AGENTS-block instructions in the current session prompt.

## Read in this order before any sprint

- `CLAUDE.md` — operating rules, workflow, HUMAN_ONLY gates
- `README.md` — setup, architecture, env vars, migrations
- `ROADMAP.md` — current sprint state and next candidates
- `PRODUCT_STRATEGY.md` — product direction and non-goals
- `LEGAL.md` — legal/compliance triggers and gaps
- `LAUNCH_AUDIT.md` — launch blockers and production readiness
- `CURRENT_HANDOFF.md` — latest PM handoff, if present
- `DESIGN.md` — design tokens, component rules, copy tone, a11y

## HUMAN_ONLY (never autonomous)

Auth, Supabase migrations, Redis voting logic, middleware, Stripe
pricing/subscription/webhook/entitlements, billing, security, legal
docs, env vars, admin allowlist, AI auto-publish, git push, deploys.

Do not push, deploy, or write to production DB unless the user prompt
in the current session explicitly authorizes it. See
`CLAUDE.md → Autonomous / Ralph-style Safe Tasks` for the full
classification of SAFE_AUTONOMOUS / SEMI_AUTONOMOUS / HUMAN_ONLY work.
