#!/bin/bash
cd "$(dirname "$0")"
git add \
  lib/redis.ts \
  app/api/vote/route.ts \
  app/api/events/track/route.ts \
  README.md \
  ROADMAP.md
git commit -m "fix: vote integrity — atomic replaceVote (Lua), granular rate limits, server-side funnel events"
git push
