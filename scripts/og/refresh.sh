#!/bin/zsh
# Thursday auto-refresh of og.png (run by launchd: com.ryanlongo.family-og-refresh).
# Renders the next-2-weeks schedule card and pushes it; Vercel redeploys the
# static site, so Friday's texted link previews the fresh image.
set -e
cd "$(dirname "$0")"
/usr/local/bin/node render.mjs 2>/dev/null || node render.mjs
cd ../..
if ! git diff --quiet og.png; then
  git add og.png
  git commit -m "Refresh share image ($(date +%m/%d/%Y))"
  git push
fi
