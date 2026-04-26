#!/bin/bash
# GROWTH SPRINT v2: personality fix + admin hardening + adblock + analytics + cron + SEO
# Run: double-click in Finder

WORKSPACE="/Users/matteopizzi/Documents/Claude/Projects/Pasive Income/splitvote"
TARGET="/Volumes/LOS ANGELES/Matteo/Dev Roba Mia/splitvote"

echo "============================================"
echo "  SplitVote — Growth Sprint v2"
echo "============================================"
echo ""
echo "  Personality fix:"
echo "   1. lib/personality.ts              — apostrophe fix (double-quoted strings)"
echo ""
echo "  Admin hardening (defensive createAdminClient):"
echo "   2. lib/supabase/admin.ts           — tryCreateAdminClient() + env var docs"
echo "   3. app/admin/page.tsx              — diagnostic UI if service role key missing"
echo "   4. app/u/[id]/page.tsx             — switched to anon client (public data)"
echo "   5. app/api/admin/polls/[id]/reject/route.ts — try/catch"
echo "   6. app/api/admin/polls/[id]/approve/route.ts — try/catch"
echo "   7. app/api/stripe/webhook/route.ts — try/catch"
echo ""
echo "  Growth sprint features:"
echo "   8. app/api/vote/route.ts           — trackDailyVote (anon+logged-in stats)"
echo "   9. app/admin/AdminCharts.tsx       — stacked bars anon/logged-in"
echo "  10. lib/dynamic-scenarios.ts        — locale + SEO fields"
echo "  11. app/api/cron/generate-dilemmas/route.ts — EN+IT + SEO + validazione"
echo "  12. app/api/admin/dilemmas/route.ts — debug endpoint Redis"
echo "  13. app/sitemap.ts                  — lastModified reali + /personality"
echo "  14. lib/personality.ts              — assi morali + archetipi"
echo "  15. app/api/personality/route.ts    — GET /api/personality"
echo "  16. app/personality/page.tsx        — UI profilo morale"
echo "  17. app/layout.tsx                  — /personality in navbar"
echo "  18. components/MobileMenu.tsx       — /personality in mobile menu"
echo "  19. components/AdBlockBanner.tsx    — ethical soft support message"
echo "  20. supabase/migration_v5_vote_daily_stats.sql — reference only"
echo ""

if [ ! -d "$TARGET/.git" ]; then echo "❌ Git repo non trovato in $TARGET"; exit 1; fi

echo "[ 1/4 ] Copia file..."

copy_file() {
  local rel="$1"
  local src="$WORKSPACE/$rel"
  local dst="$TARGET/$rel"
  local dir
  dir=$(dirname "$dst")

  if [ ! -f "$src" ]; then
    echo "  ⚠️  $rel — non trovato nel workspace, skip"
    return
  fi

  mkdir -p "$dir"

  if [ ! -f "$dst" ]; then
    cp "$src" "$dst"
    echo "  ✅ $rel (NEW)"
  elif diff -q "$src" "$dst" > /dev/null 2>&1; then
    echo "  ⏩ $rel (identico, skip)"
  else
    cp "$src" "$dst"
    echo "  📝 $rel (aggiornato)"
  fi
}

# Personality fix
copy_file "lib/personality.ts"

# Admin hardening
copy_file "lib/supabase/admin.ts"
copy_file "app/admin/page.tsx"
copy_file "app/u/[id]/page.tsx"
copy_file "app/api/admin/polls/[id]/reject/route.ts"
copy_file "app/api/admin/polls/[id]/approve/route.ts"
copy_file "app/api/stripe/webhook/route.ts"

# Growth sprint features
copy_file "app/api/vote/route.ts"
copy_file "app/admin/AdminCharts.tsx"
copy_file "lib/dynamic-scenarios.ts"
copy_file "app/api/cron/generate-dilemmas/route.ts"
copy_file "app/api/admin/dilemmas/route.ts"
copy_file "app/sitemap.ts"
copy_file "app/api/personality/route.ts"
copy_file "app/personality/page.tsx"
copy_file "app/layout.tsx"
copy_file "components/MobileMenu.tsx"
copy_file "components/AdBlockBanner.tsx"
copy_file "supabase/migration_v5_vote_daily_stats.sql"

echo ""
echo "[ 2/4 ] Install deps + TypeScript check..."
cd "$TARGET" || exit 1

# Ensure all deps are installed in the target repo (handles missing @supabase/ssr etc.)
echo "  → npm install..."
npm install --legacy-peer-deps 2>&1 | tail -3

npm run typecheck 2>&1
TSC_EXIT=$?
if [ $TSC_EXIT -ne 0 ]; then
  echo ""
  echo "❌ TypeScript errors — push annullato. Fix errors and retry."
  exit 1
fi
echo "✅ TypeScript OK"

echo ""
echo "[ 3/4 ] Build check..."
NODE_MAJOR=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "  ⚠️  Node.js $NODE_MAJOR rilevato — Next.js richiede ≥18 per il build locale."
  echo "  ✅ TypeScript OK (già verificato). Build locale saltata: Vercel usa Node 18+ e farà build in cloud."
  echo "  → Aggiorna Node.js sul drive esterno con: nvm install 18 && nvm use 18"
else
  npm run build 2>&1
  BUILD_EXIT=$?
  if [ $BUILD_EXIT -ne 0 ]; then
    echo ""
    echo "❌ Build fallita — push annullato. Fix errors and retry."
    exit 1
  fi
  echo "✅ Build OK"
fi

echo ""
echo "[ 4/4 ] Git commit + push..."

git add \
  "lib/personality.ts" \
  "lib/supabase/admin.ts" \
  "app/admin/page.tsx" \
  "app/u/[id]/page.tsx" \
  "app/api/admin/polls/[id]/reject/route.ts" \
  "app/api/admin/polls/[id]/approve/route.ts" \
  "app/api/stripe/webhook/route.ts" \
  "app/api/vote/route.ts" \
  "app/admin/AdminCharts.tsx" \
  "lib/dynamic-scenarios.ts" \
  "app/api/cron/generate-dilemmas/route.ts" \
  "app/api/admin/dilemmas/route.ts" \
  "app/sitemap.ts" \
  "app/api/personality/route.ts" \
  "app/personality/page.tsx" \
  "app/layout.tsx" \
  "components/MobileMenu.tsx" \
  "components/AdBlockBanner.tsx" \
  "supabase/migration_v5_vote_daily_stats.sql"

git commit -m "growth sprint v2: personality fix + admin hardening + analytics + cron + personality benchmark

Personality fix:
lib/personality.ts:
- Fix apostrophe syntax error: all ARCHETYPES description/tagline/shareText
  converted from single-quoted to double-quoted strings (SWC parser crash)

Admin hardening (defensive createAdminClient):
lib/supabase/admin.ts:
- tryCreateAdminClient(): returns {client, error} instead of throwing
- Improved error message listing exact missing env var(s)
- Docs: required Vercel env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)

app/admin/page.tsx:
- createAdminClient() wrapped in try/catch
- Shows readable diagnostic UI if SUPABASE_SERVICE_ROLE_KEY is missing
- Lists exact Vercel settings path to fix it

app/u/[id]/page.tsx:
- Switched from createAdminClient() to createClient() (anon server client)
- Public profile page must not depend on service role key
- RLS on profiles/user_badges handles public read access

app/api/admin/polls/[id]/reject/route.ts:
app/api/admin/polls/[id]/approve/route.ts:
app/api/stripe/webhook/route.ts:
- createAdminClient() wrapped in try/catch in all admin API routes
- Returns structured JSON error instead of unhandled exception

Growth sprint features (P1-P5):
app/api/vote/route.ts: trackDailyVote() non-blocking (anon + logged-in stats)
app/admin/AdminCharts.tsx: stacked bars anon/logged-in + fallback solid bar
lib/dynamic-scenarios.ts: locale + seoTitle/seoDescription/keywords fields
app/api/cron/generate-dilemmas/route.ts: EN+IT loop + SEO fields + validazione
app/api/admin/dilemmas/route.ts: debug endpoint Redis dilemmi (admin only)
app/sitemap.ts: lastModified reali da generatedAt + /personality page
lib/personality.ts: MORAL_AXES + ARCHETYPES + calculateProfile()
app/api/personality/route.ts: GET /api/personality (auth required)
app/personality/page.tsx: UI profilo morale + share button
app/layout.tsx + components/MobileMenu.tsx: /personality link (Compass icon, cyan)
components/AdBlockBanner.tsx: ethical soft support message (localStorage 30d, gtag)

Required Vercel env vars:
  NEXT_PUBLIC_SUPABASE_URL      (public)
  NEXT_PUBLIC_SUPABASE_ANON_KEY (public)
  SUPABASE_SERVICE_ROLE_KEY     (secret — never expose to browser)

NOTE: migration_v5_vote_daily_stats.sql apply manually in Supabase SQL Editor.
NOTE: Stripe BLOCKED until compromised key is revoked."

echo "✅ Commit OK"
echo ""

git push && echo "" && echo "✅ GROWTH SPRINT v2 DEPLOYATO" || echo "❌ Push fallito"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  STEP MANUALE RICHIESTO — Supabase SQL Editor            ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║  Applica SOLO dopo che Vercel mostra 'Ready':            ║"
echo "║  1. Apri: https://supabase.com/dashboard/project/        ║"
echo "║           eaphpnaxonlbgiiehvhz/sql/new                   ║"
echo "║  2. Esegui: supabase/migration_v5_vote_daily_stats.sql   ║"
echo "║                                                           ║"
echo "║  Query verifica post-migration:                          ║"
echo "║  SELECT table_name FROM information_schema.tables        ║"
echo "║  WHERE table_name = 'vote_daily_stats';                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "🧪 VERIFICA POST-DEPLOY:"
echo "   /api/admin/dilemmas        — debug Redis (solo admin)"
echo "   /personality               — profilo morale (login required)"
echo "   /admin                     — grafici con dati reali"
echo "   /sitemap.xml               — controlla lastModified"
echo "   /u/[id]                    — profilo pubblico (ora usa anon client)"
echo ""
echo "⚠️  STRIPE BLOCCATO finché la chiave compromessa non è revocata:"
echo "   https://dashboard.stripe.com/apikeys"
