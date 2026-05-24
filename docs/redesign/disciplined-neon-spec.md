---
spec: disciplined-neon
version: "0.1 draft"
status: PM review pending
created: 2026-05-22
audit_source: SPRINT DISCIPLINED-NEON-HOME-AUDIT-01 (22 May 2026)
applies_to:
  - app/page.tsx
  - app/it/page.tsx
  - components/DailyDilemma.tsx
scope: home surface only (S1). Site-wide orb reduction, Play/Results, OG cards, and Profile/share are explicitly out of scope and listed as later sprints.
authoritative_design_doc: DESIGN.md
---

# Disciplined Neon — Design Direction

A visual refresh of SplitVote's neon dark-mode aesthetic. Keeps the dark-navy + neon-accent character defined in `DESIGN.md`, removes decorative excess, and concentrates glow on moments that actually matter to the user.

This document is intentionally tighter than `DESIGN.md`. `DESIGN.md` is the source of truth for tokens; this document is the source of truth for what "disciplined" means in concrete editorial choices.

---

## 1. What "disciplined" means

| Principle | Rule |
|---|---|
| Fewer decorative orbs | At most two ambient orbs at any time, one primary + one accent. The rest is empty space. |
| Controlled glow | Glow is reserved for: key CTAs, post-vote reveal, and the DailyDilemma card. Everything else stays flat. |
| Readable hierarchy | Hero is the biggest thing on the page. Section headers are distinctly smaller. Body text and metadata are quiet. No competition between H1 and section labels. |
| Mobile-first | Layouts and type scales are written for 375px first, scaled up. Desktop is an override, not the default. |
| Emoji decorative / aria-hidden | Every emoji used for ornament (scenario icons, section headers, category cards) carries `aria-hidden="true"`. Screen readers do not announce them. |
| Category and metadata are real text | Category labels, vote counts, timestamps, and "Resets in" use accessible text styles (`text-[var(--muted)]` or stronger) on the actual page background. No yellow-on-yellow, no purple-on-purple. |

These six principles together replace the cosmetic-only "more neon" instinct.

---

## 2. Scope

### In scope for S1 (home surface only)

- `app/page.tsx`
- `app/it/page.tsx`
- `components/DailyDilemma.tsx`

S1 touches only these three files. EN/IT parity is mandatory — every change ships in both locales in the same commit.

### Not in scope for S1

- `app/layout.tsx` — site-wide orbs live here. **Do not touch in S1.**
- `app/globals.css` — token + utility definitions. **Do not touch in S1.**
- `tailwind.config.js` — breakpoints and fonts. **Do not touch in S1.**
- `components/DilemmaCard.tsx`, `components/DilemmaGrid.tsx`, `components/VotedDilemmaCard.tsx`, `components/DilemmaOptionPills.tsx` — shared beyond home. Modifying them would ripple into trending, category pages, and search. PM must explicitly accept that ripple before S1 touches them.
- All Play / Results / Profile / OG / Share surfaces. Each gets its own sprint (see §7).

### Hard non-goals

- No new dependencies.
- No new fonts unless PM approves separately.
- No changes to vote engine, Redis logic, auth, middleware, Stripe, AdSense, cookie consent, sitemap, or robots.
- No changes to `force-dynamic` on the home routes.
- No changes to JSON-LD schemas or hreflang metadata.
- No copy changes (those go through copy sprints with EN/IT parity review).

---

## 3. Rules

### 3.1 Glow

- **Primary CTA glow**: the DailyDilemma "Reveal the split" button retains `neon-glow-yellow`. Other CTAs may glow only if they are the primary action on their screen.
- **Reveal-moment glow**: post-vote result bars and minority/majority banners may glow. Defined in S2, not S1.
- **DailyDilemma emphasis**: the card border + faint yellow gradient stay. Yellow header pulse stays.
- **Everything else**: no glow. This includes nav links, category filter pills, secondary buttons, footer links, and section headers.

### 3.2 No dashboard feel

The home is a game lobby, not an analytics surface. Avoid:

- Dense rows of stat numbers.
- Tightly-packed cards in three+ columns.
- Stacked badges, icons, and counters on a single card.
- "All sections visible at once" desktop layouts. Breathing room over information density.

### 3.3 No nested card clutter

- `.card-neon` does not nest inside another `.card-neon`.
- Section bodies use flat lists or grids, not inner cards-of-cards.
- Inline pills (`DilemmaOptionPills`) are not promoted to cards.

### 3.4 No new dependencies

- No new npm packages.
- No new fonts unless PM approves separately. The "mono caps for metadata" option flagged in the audit is deferred until PM picks: (a) keep Inter and tighten weight/tracking, or (b) add a mono via `next/font`.

### 3.5 Data + behavior unchanged

- Anonymous voting flow unchanged.
- `existingVote`, `currentVote`, `can_change_until` unchanged.
- Vote counts, trending order, freshFirst reorder unchanged.
- Cookie + server vote-id merge unchanged.
- Personality teaser logic unchanged.

S1 is a visual refresh. It is not a refactor, a copy revision, or an analytics change.

---

## 4. Responsive targets

| Width | Class of device | Status in S1 |
|---|---|---|
| 375 px | iPhone SE / 12 mini portrait | Primary design target |
| 393 px | iPhone 14/15/16 standard portrait | Secondary mobile target |
| 768 px | iPad portrait, tablet | `md:` breakpoint |
| 1024 px | iPad landscape, small laptop | `lg:` breakpoint (where Tailwind nav unlocks) |
| 1440 px | Standard laptop / external display | Validate hero doesn't overflow; container caps at `max-w-4xl` already |
| 1920 px | Large desktop | Validate no excessive whitespace and hero still reads as the focal point |

### Layout rules

- Mobile default — write classes without prefix.
- Use only existing Tailwind breakpoints (`sm:`, `md:`, `lg:`, `xl:`, `min-[420px]:`). Do not add new breakpoints. Do not modify `tailwind.config.js`.
- At every width above, the hero h1 must:
  - Read cleanly with the existing line-break (`What would the` / `world choose?`, `Cosa sceglierebbe` / `il mondo?`)
  - Not overlap the live-pill above or the subline below
  - Stay inside the container (`max-w-4xl px-4`)
- At every width, A/B option pills inside cards must not wrap to a third line. `min-[420px]:grid-cols-2` already handles this; do not regress it.
- At every width, the DailyDilemma "Reveal the split" CTA must be tap-target ≥ 44×44 px.
- At every width, the trust strip checkmarks may wrap, but each line must remain visually grouped (one `✓ … ` per line; the green check stays with its label).

### Verification

There is no automated visual regression tooling in this repo. Visual QA is PM-side via `npm run dev` and DevTools width emulation. S1 must list each breakpoint result in its final report.

---

## 5. Implementation notes from the audit

| Reality | Implication for S1 |
|---|---|
| The Hero is inline JSX in `app/page.tsx` (≈ lines 180–225) and `app/it/page.tsx` (≈ 209–254). No dedicated `Hero` component. | Edit in place in both files. **Do not extract a component in S1** — extraction is a structural change, not a visual one. |
| The DailyDilemma component is shared (used on home only today, but conceptually a reusable hero card). | Safe to edit in S1 since its only consumer is home. Keep the public prop shape stable. |
| `DilemmaCard`, `DilemmaGrid`, and `VotedDilemmaCard` are shared by home, trending, category pages, and search. | **Do not modify** in S1 unless PM explicitly accepts the cross-surface visual change. If a card-level change is required for the home look, escalate to PM. |
| The three decorative orbs live in `app/layout.tsx` and render on every route. | **Do not modify in S1.** Site-wide orb reduction is its own sprint (see §7). If home looks "too busy" with three orbs after S1, that is a known accepted gap until the site-wide sprint lands. |
| `app/globals.css` defines neon-glow / neon-text utilities and `.card-neon`. | **Do not modify in S1.** Glow discipline is achieved by changing **usage** (removing/keeping classes on specific elements), not by editing the class definitions. |
| Both home pages use `export const dynamic = 'force-dynamic'`. | Keep both. Anti-regression rule per CLAUDE.md. |
| AdSlot renders on EN home only, below all sections. | Edits above the ad slot may shift Cumulative Layout Shift very slightly. Acceptable below-the-fold; flag in the S1 verification report if anything moves significantly. |
| There is no automated visual regression / Storybook / Chromatic / Playwright. Only `npm run typecheck`, `npm run build`, `npm run lint`, `npm run test` (vitest), and `git diff --check`. | S1 verification = type/lint/build green + PM-side visual smoke at the six widths. |

---

## 6. S1 recommended minimum

S1 is intentionally narrow. The five changes below are the entire scope.

### S1.1 — Hero scale

- Both home `<h1>` elements: replace `md:text-7xl` with `md:text-[88px]`.
- Keep `text-4xl sm:text-5xl`, `font-black`, `tracking-tight`, `leading-none`, and the gradient span.
- Mobile sizes unchanged. Only the `md:` step changes.

### S1.2 — DailyDilemma visual polish

- Adjust category contrast: replace `text-yellow-400/70` (currently `~3.5:1` against the yellow gradient panel) with `text-yellow-300` (or `text-[var(--text)]` if contrast still fails). Target ≥ 4.5:1 against the actual panel background.
- Keep the yellow border, gradient, header pulse, and `neon-glow-yellow` on the primary CTA.
- No layout shift; no copy changes.

### S1.3 — Section-header emoji aria-hidden

- All section-header emojis on both home pages get `aria-hidden="true"`. Audit identified at least:
  - EN: 🔥 (Trending), ⭐ (Most Voted), ✨ (Latest Questions), 📂 (Browse All)
  - IT: 🔥 (Featured + Trending), ✨ (Nuove Domande), 📂 (Tutti i dilemmi + Categorie), ❓ (FAQ)
  - IT FEATURED_CATEGORIES emojis (⚖️, 🆘, 🤝, 🏛️, 🕊️, 🤖)
- Scenario emoji inside DailyDilemma (`components/DailyDilemma.tsx:148`) also gets `aria-hidden="true"`.
- DilemmaCard / DilemmaGrid / VotedDilemmaCard emojis are **not** touched in S1 (shared components — see §5).

### S1.4 — Glow usage audit on home

- Visually confirm during PM smoke that glow is concentrated on:
  - The DailyDilemma card (border + CTA).
  - The blue live-pill ("Real-time global votes" / "Voti in tempo reale") above the hero.
  - The three game-loop numbers (1/2/3 with their `neon-text-*` accents) — accepted as a moment of color rhythm.
- Everything else on the page must read flat (section headers, trust strip, browse-all category filter pills).
- If anything else glows, file as an S1.4 follow-up, not a separate sprint.

### S1.5 — No copy, no token, no font changes

Explicit by exclusion. Anything beyond §6.1–§6.4 is out of S1.

### Out of S1 (open PM decisions)

- Mono caps on metadata.
- Site-wide orb reduction.
- Result-reveal glow on `/results`.
- Hero scale at small mobile (< 393 px) — left at `text-4xl`.
- Whether `app/it/page.tsx` should get an AdSlot to match EN (currently has none — this is a content/policy question, not a design one).

---

## 7. Later sprints

| Sprint | Surface | Trigger | Notes |
|---|---|---|---|
| **S1 Home** | `app/page.tsx`, `app/it/page.tsx`, `components/DailyDilemma.tsx` | This spec, after PM GO | Minimum defined in §6 |
| **S2 Play/Results** | `app/play/[id]/**`, `app/results/[id]/**`, `app/it/play/**`, `app/it/results/**` | After S1 ships and stabilizes | Includes reveal-moment glow rules; preserves `force-dynamic` on play, `revalidate=60` + `?voted=` bypass on results |
| **S3 OG dynamic** | `app/api/og`, `app/api/story-card` | After S2 | Match the disciplined-neon aesthetic in 1200×630 + 1080×1920 generated images. Likely fewer glow layers due to PNG rendering constraints |
| **S4 Profile & share card** | `app/profile/**`, public profile share surfaces | After S3 | Coordinate with privacy + share-safety rules in DESIGN.md §3 and §5.6 |
| **Optional site-wide orb discipline** | `app/layout.tsx`, `app/globals.css` | Any time PM accepts the cross-surface visual change | Removes `bg-orb-mid` + `bg-orb-cyan`, keeps `bg-orbs::before/::after`. Affects every route. Must be QA'd against /play, /results, /trending, /blog, /profile, /admin |

S1 ships independently. S2–S4 may be re-ordered. The optional orb sprint can land before or after S2 depending on PM appetite.

---

## 8. Open PM decisions

Before S1 implementation can start, PM needs to confirm:

1. **Mono caps on metadata** — keep Inter and tighten weight/tracking, or add a mono font via `next/font`? Default if no answer: keep Inter, out of S1.
2. **Site-wide orb reduction** — keep three orbs site-wide until the optional sprint lands, or run the optional sprint together with S1? Default if no answer: keep three orbs, defer.
3. **DilemmaCard ripple** — accept that S1 leaves `DilemmaCard` untouched (its category label, its emoji aria-hidden state, its glow level) and address it only when its other consumers — trending, category, search — get their own visual pass? Default if no answer: yes, defer.
4. **AdSlot on IT home** — out of design scope but worth flagging during S1: EN home has an AdSlot, IT does not. Confirm intentional?
5. **Hero h1 at 375 px** — keep `text-4xl` (36 px) or push higher? Default if no answer: keep, S1 only changes `md:` step.

---

## 9. Status

- **0.1 draft** — created 22 May 2026 from audit findings.
- **S1 home** shipped 22 May 2026 (`2bb30d2` + `aafd477` + `5fa19d4` + `3881246` + `90df8c2`).
- **Site-wide orb cleanup** shipped 22 May 2026 (`3881246` + `90df8c2`).
- **Home density discipline** added 24 May 2026 (`528bcb3` — see §10 below).
- Next: S2 Play / Results pass, then S3 OG / story-card, then S4 Profile.

---

## 10. Home density discipline

> Added 24 May 2026 from `SPRINT: HOME-DECLUTTER-AND-DILEMMA-QUALITY-RECOVERY-01`.

**Rule:** the home page (EN + IT) carries **at most one card grid section** below the DailyDilemma. The wall of 3–5 mutually-exclusive card sections that preceded this sprint conflicted with the disciplined-neon principle of "one focal moment per surface" — DailyDilemma cannot be the focal moment if it competes with three sibling card walls and a Browse-All grid below it.

**Target home structure (EN and IT identical in shape):**

```
Hero (h1 + subline)
  ↓
Game loop strip
  ↓
Trust strip (anonymity + reveal framing)
  ↓
DailyDilemma  ← focal moment
  ↓
PersonalityTeaser (small inline, logged-in only)
  ↓
One continuation section, max 4 cards
  ↓
Compact CTA chip strip (/trending, /topics, /leaderboard, /faq)
  ↓
AdSlot (EN only — IT intentionally no AdSlot for now)
```

**The single continuation section** ("Pick your next" / "Per te") uses a deterministic 4-card blend:

- 1 from trending
- 1 from most-voted (EN) or featured (IT)
- 2 from newly-generated
- Fallback: if a primary slot is empty, pad from a 2nd of any remaining source. Cap at 4.

**What no longer lives on home:**

- Multiple parallel card sections (Trending Now / Most Voted / Latest Questions, Dilemmi in Evidenza / Di Tendenza / Nuove Domande)
- Full `DilemmaGrid` Browse-All / Tutti i dilemmi grid
- IT "Esplora per Categoria" grid (categories accessible via `/it/temi`)
- IT FAQ accordion (full FAQ at `/it/faq`)

**SEO note on FAQ JSON-LD:** removing the visible FAQ accordion from IT home also removed the home-level `FAQPage` JSON-LD (Google requires structured data to reflect visible page content). `/it/faq` carries the full FAQ content as `<details>` blocks but does not yet carry its own `FAQPage` JSON-LD — a small follow-up SEO sprint should add it.

**EN/IT parity:** structurally identical. Section copy adapts naturally per locale. Both home routes pass `dynamic = 'force-dynamic'` so the continuation blend stays per-request fresh.
