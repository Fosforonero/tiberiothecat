#!/bin/bash
cd "$(dirname "$0")"
export NVM_DIR="$HOME/.nvm"
# shellcheck source=/dev/null
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use
git add \
  lib/social-content.ts \
  scripts/generate-social-content.mjs \
  push_social_content_factory_phase2.command
git commit -m "feat: social content factory phase 2 — UTM links, playUrl/resultsUrl, per-platform publish checklist"
git push
