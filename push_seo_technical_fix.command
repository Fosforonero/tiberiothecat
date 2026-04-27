#!/bin/bash
cd "$(dirname "$0")"
git add \
  app/layout.tsx \
  app/it/page.tsx \
  app/play/[id]/page.tsx \
  app/it/play/[id]/page.tsx \
  app/results/[id]/page.tsx \
  app/it/results/[id]/page.tsx \
  app/would-you-rather-questions/page.tsx \
  app/moral-dilemmas/page.tsx \
  app/it/domande-would-you-rather/page.tsx \
  app/it/dilemmi-morali/page.tsx \
  app/sitemap.ts \
  README.md \
  ROADMAP.md
git commit -m "fix: SEO technical — deduplicate titles, add hreflang play/results, JSON-LD on results"
git push
