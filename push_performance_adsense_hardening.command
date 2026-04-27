#!/bin/bash
cd "$(dirname "$0")"
git add \
  middleware.ts \
  app/layout.tsx \
  "app/play/[id]/VoteClientPage.tsx" \
  "app/results/[id]/ResultsClientPage.tsx" \
  .gitignore \
  package.json \
  README.md \
  ROADMAP.md
git commit -m "fix: middleware public route optimization, AdSense official script, IT option labels, OG download"
git push
