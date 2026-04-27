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

echo "Done: mission server-validation + admin seed batch UI pushed to origin/main."
