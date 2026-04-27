#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

if [ -s "$HOME/.nvm/nvm.sh" ]; then
  source "$HOME/.nvm/nvm.sh"
  nvm use
fi

npm run typecheck
npm run build
git diff --check

git push origin main

echo "Done: share_result mission + user_events tracking pushed to origin/main."
echo ""
echo "⚠️  Apply migration before testing share_result mission:"
echo "   Supabase dashboard → SQL Editor → paste supabase/migration_v8_user_events.sql → Run"
