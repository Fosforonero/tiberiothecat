---
design_system: SplitVote
version: "1.0"
last_updated: "2026-05-03"
tokens_source:
  - "app/globals.css — CSS custom properties (:root)"
  - "tailwind.config.js — fontFamily, animation, keyframes"
  - "components/* — actual usage patterns extracted from source"
scope: >
  All public-facing surfaces (EN + IT) and admin UI.
  Admin inherits all base tokens; no separate admin design system.
  This file is authoritative for visual governance.
  Agents must read it before writing Tailwind classes or inline styles.

colors:
  # Structural tokens — use via CSS var, never hardcode hex in components
  bg:        "#070718"   # page background, deep navy (not pure black)
  surface:   "#0f0f2a"   # card/panel background (.card-neon base)
  surface2:  "#141432"   # elevated surface on hover (.card-neon:hover)
  border:    "#24245a"   # default border everywhere
  border-hi: "#3a3a80"   # hover/active border elevation
  text:      "#e4eaf6"   # primary body text
  muted:     "#7890b8"   # secondary text, placeholders, captions

  # Vote semantics — A is always red, B is always blue
  accent-a: "#ff3366"    # Option A (red) — vote buttons, result bars, option pills
  accent-b: "#4d9fff"    # Option B (blue) — vote buttons, result bars, option pills

  # Neon accent palette — for glow effects, dividers, highlights
  neon-blue:   "#00d4ff"  # dividers, expert insight, nav hover ring
  neon-purple: "#b44dff"  # mid-orb, AI badges, personality surfaces
  neon-red:    "#ff3366"  # same hex as accent-a; used as text-shadow color
  neon-green:  "#00ff88"  # success/new states
  neon-yellow: "#ffd700"  # DailyDilemma, premium star, trending badge

typography:
  font_family: "Inter (var(--font-inter)), system-ui, sans-serif"
  font_smoothing: "antialiased (both -webkit and -moz)"
  base_size: "browser default 16px — no override on <html>"
  scale:
    "[10px]":  "badge/timestamp text (text-[10px])"
    "text-xs": "12px — captions, meta, category labels, nav links, badge labels"
    "text-sm": "14px — body copy, card questions, button text, mobile menu items"
    "text-base": "16px — card questions on sm: and above"
    "text-lg": "18px — voted recap text, vote button option text"
    "text-xl": "20px — section headings, results question"
    "text-2xl": "24px — play page question, hero sub-headings"
    "text-3xl": "30px — play page question on md:"
    "text-4xl-7xl": "hero h1 responsive stack: text-4xl sm:text-5xl md:text-7xl"
  weights:
    "font-semibold (600)": "card question text, expert insight body"
    "font-bold (700)":     "headings, CTA button labels, section titles"
    "font-black (900)":    "hero h1, key stats, vote count reveals, section headers"
  tracking:
    "tracking-widest": "badge labels, category names, nav links — always uppercase"
    "tracking-tight":  "hero h1 only"
  leading:
    "leading-none":    "hero h1"
    "leading-snug":    "card/play question text"
    "leading-relaxed": "body paragraphs, expert insight, FAQ answers"

spacing:
  container:
    home_trending: "max-w-4xl (896px) — px-4 py-12 sm:py-16"
    play_results:  "max-w-2xl (672px) — px-4 py-16"
  card_padding:  "p-5 sm:p-6"
  card_gap:      "gap-3 sm:gap-4"
  section_gap:   "mb-12"
  grid:          "grid-cols-1 sm:grid-cols-2"

radius:
  card:         "rounded-2xl (16px) — standard interactive card"
  card_hero:    "rounded-3xl (24px) — DailyDilemma only"
  button:       "rounded-xl (12px) — CTAs, filters, mobile menu items"
  badge:        "rounded-full — all badge chips"
  menu_dropdown: "16px — mobile menu dropdown (inline style)"
  focus_ring:   "4px — :focus-visible outline border-radius"

glow:
  # Box-shadow glow classes defined in globals.css
  neon-glow-blue:   "0 0 8px rgba(77,159,255,0.4), 0 0 24px rgba(77,159,255,0.2), 0 0 48px rgba(77,159,255,0.08)"
  neon-glow-red:    "0 0 8px rgba(255,51,102,0.4), 0 0 24px rgba(255,51,102,0.2), 0 0 48px rgba(255,51,102,0.08)"
  neon-glow-purple: "0 0 8px rgba(180,77,255,0.4), 0 0 24px rgba(180,77,255,0.2)"
  neon-glow-cyan:   "0 0 8px rgba(0,212,255,0.4), 0 0 24px rgba(0,212,255,0.2)"
  neon-glow-yellow: "0 0 8px rgba(255,215,0,0.4), 0 0 24px rgba(255,215,0,0.2)"
  card_hover:       "0 4px 24px rgba(77,159,255,0.12), 0 0 0 1px rgba(77,159,255,0.1) inset"
  menu_dropdown:    "0 12px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(77,159,255,0.15)"
  # Text-shadow classes
  neon-text-blue:   "text-shadow: 0 0 10px rgba(77,159,255,0.7)"
  neon-text-red:    "text-shadow: 0 0 10px rgba(255,51,102,0.7)"
  neon-text-purple: "text-shadow: 0 0 10px rgba(180,77,255,0.7)"
  neon-text-cyan:   "text-shadow: 0 0 10px rgba(0,212,255,0.8)"
  neon-text-yellow: "text-shadow: 0 0 10px rgba(255,215,0,0.8)"

motion:
  pop:            "0.15s ease-out — scale 0.95→1 (button press feedback)"
  slide_in:       "0.4s ease-out — opacity 0 + translateY(20px)→visible (page enter)"
  vote_tap:       "0.22s ease-out — scale 1→1.018→0.99 (vote button tap)"
  slide_down:     "0.18s ease — mobile menu open"
  pulse_glow:     "2s ease-in-out infinite — live indicator blink"
  result_bar:     "1s ease-out — width transition (result reveal animation)"
  result_delay:   "500ms after vote before percentages appear"
  orb_drift:      "14–24s ease-in-out infinite alternate — decorative background orbs"
  card_hover_lift: "translateY(-2px), transition: all 0.2s ease"
  reduced_motion: "All decorative animations removed via @media (prefers-reduced-motion: reduce)"

breakpoints:
  "min-[420px]": "420px — DilemmaOptionPills 2-col grid"
  "sm":  "640px — standard Tailwind"
  "md":  "768px — standard Tailwind"
  "lg":  "1024px — desktop nav visible"
  "xl":  "1280px — standard Tailwind (rarely needed)"

nav:
  height:     "~56px (mobile menu positions top: 56px)"
  background: "rgba(7,7,24,0.75) + backdrop-filter: blur(12px)"
  border:     "border-b border-[var(--border)]"
  logo_height: "h-[28px] (wordmark PNG)"
  link_style: "text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-transparent"
---

# SplitVote Design System

Governance document for all visual and UX decisions in SplitVote. Read this before writing any Tailwind class, inline style, or copy string in a UI sprint.

---

## 1. Product Visual Identity

SplitVote is a **global real-time voting game**, not a survey tool. The visual language must communicate urgency, social scale, and emotional weight simultaneously.

**Character:** Dark-space game aesthetic with neon accents. Deep navy background (`#070718`), not pure black. Animated radial-gradient orbs and a dot-grid texture create depth without distracting from content.

**Color semantics are fixed and non-negotiable:**
- **Red (`accent-a`)** = Option A, always. On vote buttons, result bars, option pills.
- **Blue (`accent-b`)** = Option B, always. On vote buttons, result bars, option pills.
- **Yellow (`neon-yellow`)** = DailyDilemma and premium/pro status.
- **Purple** = AI-generated content, personality surfaces.
- **Cyan** = Expert insight panel.
- **Orange** = Trending badge, challenge/urgency banner.
- **Green** = New content badge, success state, streak/earned rewards.

**Background system:**
- Page: `var(--bg)` (#070718)
- Cards/panels: `var(--surface)` (#0f0f2a)
- Elevated card (hover): `var(--surface2)` (#141432)
- Three animated orbs (red-pink, blue, purple) at `opacity: 0.13–0.25`, `blur(110–130px)` — always `aria-hidden="true"`, disabled under `prefers-reduced-motion`
- Dot grid texture: `body::before`, fixed, `pointer-events: none`, `aria-hidden` via CSS

**Brand assets:**
- Wordmark: `/brand/splitvote_wordmark.png`, rendered at `h-[28px]`
- Favicon/icons: standard set in `/public/` (192, 512, apple-touch 180px)
- OG card: 1200×630 (`/api/og?id=`)
- Story card: 1080×1920 (`/api/story-card?id=&locale=`)
- Pixie avatar: pixel-art creature in `/public/pixie/` (future Phase 2+)

---

## 2. Core UX Loop

The designed user journey, in order:

```
1. Land on home → see DailyDilemma card → click → play page
2. Read question → choose Option A or B → 3s grace countdown
3. Vote submitted → redirect to /results?voted=X
4. 500ms delay → percentages revealed with animated bars
5. See minority/majority banner → share or go next
```

**Framing rules:**
- Anonymous vote first, login never required for voting
- Question shown before options (never bury it below the fold)
- Live vote count shown on play page to signal social scale
- "Reveal the split" / "Scopri il risultato" — CTA copy emphasizes the social reveal, not just "vote"
- Post-vote: immediately show how you compare to the world (minority/majority banner, result bars)
- Game loop strip order: **Vote → See how the world splits → Grow your Pixie**
  - This strip must appear **above** the DailyDilemma card, not below it
  - Numbers colored: `text-blue-400` for 1, `text-purple-400` for 2, `text-yellow-400` for 3

**Grace period UX (play page):**
- After option selected: 3s countdown before POST — user can Undo or Confirm early
- Countdown: `copy.graceCountdown(seconds)` — EN: "Recording in 3…", IT: "Registrazione tra 3…"
- Undo button prominent; grace hint text explains the window
- `animate-vote-tap` class plays on button selection (scale pulse, 0.22s)

**Already-voted state:**
- Logged-in users: server-side `existingVote` prop → locked UI with "✅ You already voted" banner
- Anonymous users: `sv_voted_{id}` cookie → client `useEffect` redirect to `/results/{id}?voted=X`
- Home/trending (ISR pages): voted state must be handled client-side — see Section 5 rules

---

## 3. Design Principles

1. **Anonymous first.** Never gatekeep voting. No login prompt before the vote completes.
2. **Frictionless over complete.** Fewer taps. No unnecessary confirmation dialogs. Vote in 2 taps from home.
3. **Live urgency.** Vote counts, countdown timers, trending labels — the platform feels alive.
4. **Neon on dark only.** This is a permanently dark-mode product. No light-mode styles exist or should be added.
5. **EN/IT parity.** Every copy string and UX pattern must ship with both `EN_COPY` and `IT_COPY` objects. No silent EN-only launches.
6. **Earned > bought.** Visual hierarchy must reflect effort over spending. Earned-only states (streaks, milestones) look more special than Premium cosmetics.
7. **No right answers.** Copy never implies a "correct" choice. Both options must feel morally defensible.
8. **Aggregate share, never personal vote.** Sharing surfaces show global percentages, not what the current user chose.

---

## 4. Design Tokens

> All tokens are derived from `app/globals.css` and `tailwind.config.js`. See YAML front matter for full values.

### 4.1 Colors

Use CSS vars for structural tokens. Use Tailwind utility classes for contextual/state colors.

| Token | Hex | Use |
|---|---|---|
| `var(--bg)` | `#070718` | Page background |
| `var(--surface)` | `#0f0f2a` | Cards, panels, dropdowns |
| `var(--surface2)` | `#141432` | Card hover state |
| `var(--border)` | `#24245a` | Default borders |
| `var(--border-hi)` | `#3a3a80` | Hover/active border elevation |
| `var(--text)` | `#e4eaf6` | Primary body text |
| `var(--muted)` | `#7890b8` | Secondary text, placeholders |
| `var(--accent-a)` | `#ff3366` | Option A (red) |
| `var(--accent-b)` | `#4d9fff` | Option B (blue) |
| `var(--neon-blue)` | `#00d4ff` | Dividers, expert panel |
| `var(--neon-purple)` | `#b44dff` | AI badge, personality |
| `var(--neon-green)` | `#00ff88` | New/success states |
| `var(--neon-yellow)` | `#ffd700` | DailyDilemma, premium |

**Tailwind contextual classes in use** (not CSS vars — Tailwind's default palette):
- `text-orange-400 / bg-orange-500/20` — trending badge, challenge banner
- `text-green-400 / bg-green-500/20` — new badge, earned state
- `text-purple-400 / bg-purple-500/20` — AI badge, personality nav link
- `text-cyan-400 / bg-cyan-500/20` — expert insight panel, profile nav link
- `text-yellow-400 / bg-yellow-500/10` — DailyDilemma header, premium star

### 4.2 Typography

Body font: Inter (loaded via `next/font/google`, CSS var `--font-inter`). Antialiased globally.

**Heading scale on hero (`app/page.tsx`, `app/it/page.tsx`):**
```
text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-none
```
Gradient text on hero h1 accent span:
```
text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400
```

**Question text on play page:**
```
text-2xl md:text-3xl font-bold text-[var(--text)] leading-snug
```

**Category/badge label (universal pattern):**
```
text-xs font-bold uppercase tracking-widest text-[var(--muted)]
```

### 4.3 Card Pattern (`.card-neon`)

Defined in `globals.css`:
```css
.card-neon {
  transition: all 0.2s ease;
  border: 1px solid var(--border);
  background: var(--surface);
}
.card-neon:hover {
  border-color: rgba(77,159,255,0.45);
  background: var(--surface2);
  box-shadow: 0 4px 24px rgba(77,159,255,0.12), 0 0 0 1px rgba(77,159,255,0.1) inset;
  transform: translateY(-2px);
}
```

Usage: `className="card-neon group block rounded-2xl p-5 sm:p-6"` — always.

### 4.4 Neon Glow Utilities

All defined in `globals.css`. Use the class name, never copy-paste the box-shadow inline:

| Class | Color | Use |
|---|---|---|
| `.neon-glow-blue` | blue | Primary CTAs, live indicator pill |
| `.neon-glow-red` | red | Option A emphasis |
| `.neon-glow-purple` | purple | AI/personality surfaces |
| `.neon-glow-cyan` | cyan | Expert insight panel |
| `.neon-glow-yellow` | yellow | DailyDilemma card, trending |

Text variants: `.neon-text-blue`, `.neon-text-red`, `.neon-text-purple`, `.neon-text-cyan`, `.neon-text-yellow`.

### 4.5 Motion

All custom keyframes live in `globals.css` (not Tailwind config, except `pop` and `slide-in`).

| Class | Duration | Trigger |
|---|---|---|
| `animate-pop` | 0.15s | Tailwind config — button mount pop |
| `animate-slide-in` | 0.4s | Tailwind config — page section entrance |
| `.animate-vote-tap` | 0.22s | globals.css — vote button tap feedback |
| `.mobile-menu-enter` | 0.18s | globals.css — mobile menu open |
| `.pulse-glow` | 2s infinite | globals.css — live dot indicator |
| Result bar width | 1s | Inline `transition-all duration-1000 ease-out` |

**Reduced motion:** `@media (prefers-reduced-motion: reduce)` in `globals.css` disables:
- `.bg-orbs::before/after`, `.bg-orb-mid`, `.bg-orb-cyan` (orb drift)
- `.pulse-glow`
- `.mobile-menu-enter`
- `.card-neon` (transition: none)

Result bar and vote-tap animations are handled via `window.matchMedia('(prefers-reduced-motion: reduce)')` checks in component `useEffect`.

---

## 5. Component Rules

### 5.1 DilemmaCard (`components/DilemmaCard.tsx`)

**Purpose:** Server-renderable link card. No client state. Used on home, trending, category pages.

**Layout:**
```tsx
<Link href={playHref} className="card-neon group block rounded-2xl p-5 sm:p-6">
  <div className="flex items-start gap-3 sm:gap-4">
    <span className="text-3xl sm:text-4xl flex-shrink-0">{emoji}</span>
    <div className="min-w-0 flex-1">
      {/* category + badge row */}
      {/* question (line-clamp-3, font-semibold, text-sm sm:text-base) */}
      <DilemmaOptionPills optionA={...} optionB={...} />
      {/* vote count (Globe icon + text-xs text-[var(--muted)]) */}
    </div>
  </div>
</Link>
```

**Badge types and styles:**
- `trending`: `bg-orange-500/20 text-orange-400 border-orange-500/30` + `<Flame size={9} />`
- `ai`: `bg-purple-500/20 text-purple-400 border-purple-500/30` + `<Sparkles size={9} />`
- `new`: `bg-green-500/20 text-green-400 border-green-500/30`
- All badges: `text-[10px] rounded-full px-2 py-0.5 font-bold`

**Voted state (future `VotedDilemmaCard`):**
- Not currently on DilemmaCard — requires client wrapper
- When added, use `badge="voted"` pattern with green "✓ Voted" styling consistent with existing badge variants
- Swap `playHref` to `resultsHref` when voted cookie detected

### 5.2 DilemmaOptionPills (`components/DilemmaOptionPills.tsx`)

Compact option preview inside cards. Never shows full option text — truncates after first period.

```tsx
<div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
  {/* Option A — red */}
  <span className="text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1 truncate" />
  {/* Option B — blue */}
  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1 truncate" />
</div>
```

**Invariant:** A = red, B = blue. Never swap.

### 5.3 DailyDilemma (`components/DailyDilemma.tsx`)

The homepage hero interactive card. Client component (requires countdown timer).

**Distinctive styling vs. regular cards:**
- `rounded-3xl` (vs `rounded-2xl` for DilemmaCard)
- Yellow neon border: `1px solid rgba(255,215,0,0.25)` + `neon-glow-yellow`
- Yellow gradient background: `linear-gradient(135deg, rgba(255,215,0,0.06)…)`
- Header bar with `Zap` icon + `pulse-glow` + countdown timer in `font-mono`
- Full-card `<Link>` overlay at `z-0`, interactive CTAs at `z-10` with `e.stopPropagation`-equivalent via explicit `z-index`

**CTAs:**
- Primary: `bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-6 py-3 rounded-xl neon-glow-yellow hover:scale-[1.01]` — "Reveal the split" / "Scopri il risultato"
- Secondary: ghost link "See results" — `text-sm text-[var(--muted)] hover:text-white`
- Pre-vote share: `<button>` with `Share2` icon, `text-xs text-[var(--muted)] hover:text-white`

### 5.4 Vote Buttons (VoteClientPage — pre-vote state)

```tsx
<button
  className={`w-full rounded-2xl border-2 p-6 text-left font-semibold text-lg
    transition-all duration-200
    ${selected === 'A'
      ? 'border-red-500 bg-red-500/20 text-red-300 neon-glow-red'
      : 'border-red-500/20 bg-red-500/5 text-[var(--muted)] hover:border-red-500/60 hover:bg-red-500/15 hover:text-white'
    }`}
  onClick={() => handleOptionClick('A')}
>
```

- Option A: red color family
- Option B: blue color family
- Label above option text: `text-xs font-black uppercase tracking-widest text-red-400` / `text-blue-400`
- Separator: "OR" / "OPPURE" in `text-2xl font-black text-[var(--muted)]` between the two options
- Touch-to-vote feedback: `animate-vote-tap` class applied on click

**Grace period UI:**
- Selected button gains `ring-2 ring-red-500/50` or `ring-blue-500/50` border emphasis
- Countdown text: `text-sm text-[var(--muted)]` + `graceCountdown(s)` copy
- Undo button: `rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text)]`
- Confirm early: `rounded-xl bg-blue-600 hover:bg-blue-500 text-white`

**Already-voted state:**
- Selected option: `border-red-500 bg-red-500/20 text-red-300` (A) or `border-blue-500 bg-blue-500/20 text-blue-300` (B) — **interactive if `canStillChange`**
- Unselected option: `border-*/5 bg-*/5 text-[var(--muted)] opacity-40` — greyed out
- "Can change" window: shows `copy.canChange(timeRemaining)` — currently copy-only; UI affordance for changing is a known gap (C sprint)
- "Vote locked": shows `copy.voteLocked` with `🔒` when window expired

### 5.5 Result Bars (ResultsClientPage)

```tsx
<div className="h-6 bg-[var(--border)] rounded-full overflow-hidden">
  <div
    className={`h-full rounded-full transition-all duration-1000 ease-out
      ${winnerOption === 'a' ? 'bg-red-500' : 'bg-red-500/50'}`}
    style={{ width: mounted && revealed ? `${pctA}%` : '0%' }}
  />
</div>
```

- Bars start at `0%` and animate to percentage after `revealed` becomes true (500ms post-vote delay)
- Winner option gets full opacity color; losing gets `/50` opacity
- Percentage label: `text-lg font-black` — red or blue depending on winner; invisible if not yet `revealed`
- **`revealed` state:** always true when `!voted` (browsing results) or when `total < 10`; delayed when `voted` is set (post-vote reveal animation)

**Minority/Majority reveal card:**
- Tie / close (≤10% gap): `border-purple-500/30 bg-purple-500/10`
- Minority (<50%): `border-orange-500/30 bg-orange-500/10`
- Majority / landslide (≥70%): `border-green-500/30 bg-green-500/10`
- Comparing state (pre-reveal): `animate-pulse` loading text

### 5.6 Share Card / OG Surface

- OG image: `/api/og?id=` — 1200×630, server-rendered
- Story card: `/api/story-card?id=&locale=` — 1080×1920 PNG
- Share text always uses aggregate stats (pctA, pctB, majorityLabel) — never the user's personal choice
- Challenge link: `play/{id}?challenge=1[&ref={code}]` — recipient sees vote before revealing challenger's choice

### 5.7 Landing Hero (home + it home)

```tsx
{/* Pill tag */}
<div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-xs font-bold tracking-widest uppercase px-4 py-2 rounded-full mb-6 border border-blue-500/20 neon-glow-blue">
  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 pulse-glow" />
  Live votes
</div>

{/* h1 */}
<h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-5 leading-none">
  What would you choose?
  <br />
  <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-purple-400 to-blue-400">
    the world?
  </span>
</h1>

{/* Subline */}
<p className="text-base sm:text-xl text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
  Vote anonymously on impossible moral dilemmas — then see how the world splits.
</p>
```

**Game loop strip** (must appear **above** DailyDilemma):
```tsx
<div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-10 text-xs text-[var(--muted)]">
  <span><span className="text-blue-400 font-black">1.</span> Vote a dilemma</span>
  <span className="text-white/15 hidden sm:inline">→</span>
  <span><span className="text-purple-400 font-black">2.</span> See how the world splits</span>
  <span className="text-white/15 hidden sm:inline">→</span>
  <span><span className="text-yellow-400 font-black">3.</span> Grow your Pixie</span>
</div>
```

Trust strip (below game loop):
```
✓ No account required  ·  ✓ Anonymous voting  ·  ✓ See how the world votes
```
Each checkmark: `text-green-400`.

### 5.8 Nav / Header

- `<nav>` at z-index: 1 (above orbs)
- Height: ~56px (`py-3` + content)
- Glassmorphism: `background: rgba(7,7,24,0.75); backdrop-filter: blur(12px)`
- Logo: `<img src="/brand/splitvote_wordmark.png" height={28} className="h-[28px] w-auto" />`
- Desktop nav links (lg:): `NavLinks` — `text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border border-transparent`
  - Trending: `text-purple-400`; My Profile: `text-cyan-400`; others: `text-[var(--muted)]`
- Mobile menu: `MobileMenu` — portal-rendered dropdown, `width: 248px`, `borderRadius: 16px`, `backgroundColor: #0f0f2a`
  - Touch targets: `minHeight: 44px` standard, `40px` compact on `isShortViewport` (≤700px)
  - Touch targets always ≥ 40px even in compact mode; 44px standard
- `AuthButton` (anonymous): renders login link with `User` icon, `btn-neon-blue` styling
  - **Ambiguity note:** `btn-neon-blue` class is used in AuthButton but not defined in `globals.css`. Resolve with: `bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 neon-glow-blue` if this button appears unstyled.
- `AuthButton` (logged in): avatar emoji `w-8 h-8 rounded-lg hover:bg-white/10`; premium "Pro" badge `text-yellow-400 border-yellow-500/30 bg-yellow-500/10`; admin gear icon `text-red-400`

### 5.9 Footer

```tsx
<footer className="text-center text-[var(--muted)] text-xs py-10 mt-16">
  <div className="neon-divider mb-8 mx-auto max-w-2xl" />
  {/* Legal copy + links */}
  {/* Social icons: 18px inline SVGs with aria-label */}
</footer>
```

- `neon-divider`: `height: 1px; background: linear-gradient(90deg, transparent, var(--neon-blue) 40%, var(--neon-purple) 60%, transparent); opacity: 0.35`
- Social links: `hover:text-white transition-colors` with `aria-label` required on each

### 5.10 Admin UI

Inherits all base tokens. No separate design system. Specific patterns:
- Seed batch panel: status indicators use standard green/red/yellow Tailwind contextual classes
- Admin drafts: same `card-neon` base
- Destructive actions (reject, delete): `text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20`
- Progress bars: `bg-blue-500 rounded-full h-2 transition-all` (seed batch progress)

### 5.11 Empty / Error / Loading States

**Empty:**
```tsx
<div className="text-center py-16 text-[var(--muted)]">
  <p className="text-4xl mb-4">{emoji}</p>
  <p className="text-lg font-semibold text-white mb-2">{title}</p>
  <p className="text-sm">{description}</p>
</div>
```
Never use internal technical terms (e.g., "cron", "UTC timestamp") in user-facing empty state copy.

**Loading:** `animate-pulse` on placeholder text or skeleton elements.

**Error (inline):** `text-red-400 text-sm` or banner `border-red-500/30 bg-red-500/10 rounded-xl`.

**Vote error:** toast-style message using `copy.voteError` — no modal, inline below options.

---

## 6. Copy and Tone Rules (EN/IT)

### General Rules

- **Present tense, active voice** — "Vote", not "You can vote here"
- **No first-person ("I")** in UI copy — use "you" (EN) or "tu" (IT)
- **Short and direct** — question max 180 chars, option max 110 chars, badges ≤ 15 chars
- **Never judge the choice** — "You're in the 23% minority" is fine; "You chose wrong" never
- **Both options morally defensible** — copy must treat A and B with equal rhetorical weight
- **No medical, legal, financial, or psychological advice** — add `safetyNotes` field in AI-generated content
- **No real people names** (living or dead) — abstract current events into moral scenarios

### English Copy Voice

Informal but not slang. Game language with emotional weight.
- CTAs: "Reveal the split", "What would YOU choose?", "Next dilemma →", "Join free →"
- Social: "worldwide", "real-time", "honest answers"
- Urgency: "Resets in", "votes today", "Can change for Xh Ym"
- Results: "You're in the 23% minority", "X% of the world agrees with you"
- Avoid: "studies show", "research suggests", "scientifically proven"

### Italian Copy Voice

Informal **tu** form, never **Lei**. Not literal translation — natural Italian idiom.
- CTAs: "Scopri il risultato", "Tu cosa sceglieresti?", "Prossimo dilemma →", "Unisciti →"
- Social: "nel mondo", "in tempo reale", "risposte oneste"
- Urgency: "Cambia tra", "voti oggi", "Puoi cambiare per altri Xh Ym"
- Results: "Sei nel 23% della minoranza", "Il X% del mondo è d'accordo con te"
- Legal/cookie copy: must use correct Italian legal register (Privacy Policy, Termini di Servizio)

### Copy Files Location

Each component keeps EN_COPY and IT_COPY as sibling constants. All copy ships bilingual in the same PR.

### Forbidden Copy Patterns

| Pattern | Why |
|---|---|
| "Cron generates at 6:00 UTC" | Internal technical detail — never user-facing |
| "Database error" | Use "Something went wrong. Please try again." |
| "I voted for X" in share text | Never expose personal vote in aggregate share |
| "Scientifically proven" | Content is entertainment/reflective, not research |
| "AI said…" | AI drafts are edited and published as platform content |
| Option A copy styled blue, or B styled red | Color semantics are fixed: A=red, B=blue |

---

## 7. Accessibility Rules

**Focus ring:** Defined globally in `globals.css`:
```css
:focus-visible {
  outline: 2px solid rgba(77, 159, 255, 0.75);
  outline-offset: 3px;
  border-radius: 4px;
}
```
Applied on keyboard navigation only (`:focus-visible`, not `:focus`). Never suppress this.

**Touch targets:**
- Minimum: 44×44px on all interactive elements
- Compact mobile (≤700px viewport height): 40×40px acceptable as exception only (MobileMenu items)
- Vote buttons on play page: full-width, `p-6` padding — always well over minimum

**ARIA requirements:**
- `aria-hidden="true"` on ALL decorative elements: bg orbs, decorative emojis inside badges, inline SVG icons used decoratively, dot grid `body::before`
- `aria-label` required on: icon-only buttons (hamburger, auth, social links, share), nav logo link, mobile menu backdrop
- `role="menu"` + `role="menuitem"` + `aria-label` on mobile menu dropdown
- `aria-expanded={open}` + `aria-controls="mobile-menu-dropdown"` on hamburger button
- `alt` text on all `<img>` elements (wordmark: `alt="SplitVote"`, share card preview: `alt="Share card"`)

**Screen reader utility:**
```css
.sr-only {
  position: absolute; width: 1px; height: 1px; padding: 0;
  margin: -1px; overflow: hidden; clip: rect(0,0,0,0);
  white-space: nowrap; border-width: 0;
}
```
Use for text that describes icon-only buttons when no other label is available.

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .bg-orbs::before, .bg-orbs::after, .bg-orb-mid, .bg-orb-cyan,
  .pulse-glow, .mobile-menu-enter { animation: none; }
  .card-neon { transition: none; }
}
```
Component-level: result bar reveal and vote-tap animation must check `window.matchMedia('(prefers-reduced-motion: reduce)')` in `useEffect` and skip the animation, showing final state immediately.

**Keyboard accessibility:**
- All interactive elements: native `<button>`, `<a>`, `<Link>`, or explicit `role="button"` + `tabIndex={0}` + `onKeyDown` Enter/Space handler
- Modal/overlay: trap focus within mobile menu; Escape key closes it (implemented in MobileMenu)
- FAQ: `<details>/<summary>` — natively keyboard-accessible

**Color contrast:**
- `var(--text)` (#e4eaf6) on `var(--bg)` (#070718): ≈ 13.6:1 — AAA
- `var(--muted)` (#7890b8) on `var(--bg)` (#070718): ≈ 4.6:1 — AA (verify after any palette change)
- Badge text on badge backgrounds: spot-check neon-on-dark combinations if badges change

---

## 8. Agent Implementation Rules

When writing code for any UI/UX sprint, follow these rules without exception:

1. **Read DESIGN.md first.** Understand existing patterns before writing a single class.

2. **Use CSS vars for structural tokens.** Never hardcode `#070718`, `#0f0f2a`, `#24245a`, `#e4eaf6`, `#7890b8` directly in components. Use `var(--bg)`, `var(--surface)`, `var(--border)`, `var(--text)`, `var(--muted)`.

3. **Use `.card-neon` as the card base class.** Never create a one-off card style. If a card variant is needed, compose on top of `.card-neon`.

4. **Extend before creating.** Check if an existing component covers the pattern before adding a new one.

5. **Color semantics.** A = red family, B = blue family. Always. No exceptions.

6. **Accessible by default.** Every new interactive element must have:
   - `aria-label` if icon-only
   - Min 44×44px touch target
   - Visible `:focus-visible` ring (don't override it)
   - Proper HTML semantics (`<button>` for actions, `<a>` for navigation)

7. **Every string ships bilingual.** Add both `EN_COPY` and `IT_COPY` entries in the same PR. No silent EN-only strings.

8. **Respect ISR boundaries.** Home/trending use `revalidate = 3600`. Never add auth/cookie reads to server components on these pages. Per-user state must be handled client-side via `useEffect`.

9. **`force-dynamic` stays on play pages.** Never remove it — `existingVote` is fetched per-user server-side.

10. **Animations.** All custom animations must be disabled under `prefers-reduced-motion: reduce`. Add to the `@media (prefers-reduced-motion: reduce)` block in `globals.css` or check via `window.matchMedia` in `useEffect`.

11. **No new CSS variables without documentation.** If a new token is needed, add it to `globals.css` `:root` and update the `colors:` section in DESIGN.md YAML front matter.

12. **No new breakpoints.** Do not modify `tailwind.config.js` breakpoints. The existing scale (sm/md/lg/xl + `min-[420px]`) is sufficient.

13. **Decorative elements.** All animated orbs, background textures, and decorative emojis inside badges must be `aria-hidden="true"`.

14. **Share safety.** Aggregate share text never includes the user's own vote choice. Use `webShareText` pattern from `ResultsClientPage` as the canonical model.

15. **`btn-neon-blue` ambiguity.** This class is used in `AuthButton` but not defined in `globals.css`. If encountered, apply the equivalent inline: `bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 neon-glow-blue`. Resolve in a dedicated token cleanup sprint.

---

## 9. Do / Don't Examples

### DO ✅

```tsx
{/* ✅ Use card-neon as the base */}
<Link href={playHref} className="card-neon group block rounded-2xl p-5 sm:p-6">

{/* ✅ CSS var for structural colors */}
<p className="text-[var(--muted)]">Secondary copy</p>

{/* ✅ Category label — standard pattern */}
<span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
  {scenario.category}
</span>

{/* ✅ A = red, B = blue — always */}
<span className="bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-3 py-1">
  {optionA}
</span>
<span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full px-3 py-1">
  {optionB}
</span>

{/* ✅ Decorative elements are aria-hidden */}
<div className="bg-orbs" aria-hidden="true" />
<span className="text-3xl" aria-hidden="true">{scenario.emoji}</span>

{/* ✅ Icon-only button has aria-label */}
<button aria-label={isIT ? 'Condividi domanda' : 'Share question'} onClick={handleShare}>
  <Share2 size={12} aria-hidden />
</button>

{/* ✅ Neon glow via class, not inline */}
<div className="neon-glow-yellow rounded-3xl">

{/* ✅ Primary CTA on DailyDilemma */}
<Link className="bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm px-6 py-3 rounded-xl neon-glow-yellow hover:scale-[1.01]">
  Reveal the split
</Link>

{/* ✅ Game loop numbers use color hierarchy */}
<span className="text-blue-400 font-black">1.</span> Vote
<span className="text-purple-400 font-black">2.</span> See the split
<span className="text-yellow-400 font-black">3.</span> Grow your Pixie
```

### DON'T ❌

```tsx
{/* ❌ Hardcode background color */}
<div style={{ backgroundColor: '#070718' }}>  {/* use var(--bg) */}

{/* ❌ Use text-white for body text */}
<p className="text-white">Body copy here</p>  {/* use text-[var(--text)] */}

{/* ❌ Option A styled blue */}
<span className="bg-blue-500/10 text-blue-400">{scenario.optionA}</span>  {/* A is ALWAYS red */}

{/* ❌ Per-user state in ISR-cached server component */}
export const revalidate = 3600  // on app/page.tsx or app/trending/page.tsx
const cookieStore = await cookies()  // This breaks ISR — never combine these

{/* ❌ Remove force-dynamic from play page */}
// Never remove: export const dynamic = 'force-dynamic'  from app/play/[id]/page.tsx

{/* ❌ New inline box-shadow copying the glow value */}
<div style={{ boxShadow: '0 0 8px rgba(77,159,255,0.4)...' }}>  {/* use .neon-glow-blue */}

{/* ❌ Technical copy in user-facing empty state */}
<p>Il cron genera nuovi dilemmi ogni giorno alle 6:00 UTC</p>

{/* ❌ Expose user vote in share text */}
const shareText = `I voted for "${userChoice}" — what would you choose?`

{/* ❌ Icon-only button without aria-label */}
<button onClick={close}><X size={18} /></button>  {/* add aria-label="Close menu" */}

{/* ❌ Light mode styles */}
<div className="bg-white text-gray-900">  {/* SplitVote is dark-only */}

{/* ❌ New CSS variable without documenting it */}
// globals.css: --new-color: #abc123;  (must update DESIGN.md YAML front matter too)

{/* ❌ Hard-code neon-divider inline */}
<div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #00d4ff...)' }}>
{/* use: <div className="neon-divider"> */}
```

---

## Known Ambiguities and Technical Debt

| Item | Location | Status | Notes |
|---|---|---|---|
| `btn-neon-blue` undefined | `AuthButton.tsx:60` | Open | Used but not in `globals.css`. Likely resolved at runtime via Tailwind JIT from another class. Verify — if broken, resolve inline as noted in Section 8 rule 15. |
| `canStillChange` no interactive affordance | `VoteClientPage.tsx:380–470` | Known gap (C sprint) | "Can change for Xh Ym" copy exists; clicking the other option does nothing. Sprint C adds the button. |
| `DilemmaCard` no voted state | All ISR pages | Known gap (B sprint) | Requires `VotedDilemmaCard` client wrapper. Sprint B adds it. |
| `app/it/trending` empty state technical copy | `app/it/trending/page.tsx` | Known gap (D sprint) | "cron" and "6:00 UTC" are user-facing. Sprint D replaces with user-friendly copy. |
| Hero game loop strip position | `app/page.tsx`, `app/it/page.tsx` | Known gap (A sprint) | Currently rendered below DailyDilemma — should be above it. Sprint A moves it. |

---

## Optional Future Sprint: Token Extraction

If the codebase grows past 5 locales or 20+ components, consider extracting all Tailwind utility patterns into a formal design token file:

1. Move CSS vars to a dedicated `tokens.css` imported by `globals.css`
2. Extend `tailwind.config.js` with `colors` mapping CSS vars: `background: 'var(--bg)'`, etc.
3. This allows `className="bg-background"` instead of `bg-[var(--bg)]`

**Do not do this now.** The current hybrid (CSS vars + Tailwind JIT arbitrary values) is working and stable. Migrate only if token references become hard to trace or a third locale needs a different theme.
