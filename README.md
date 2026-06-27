# Longo Family Calendar

A standalone read-only family calendar site that displays custody nights, nurse days, and family events synced from FoxHole.

## Images to Add

Place these image files in the root of this project before deploying:

- `dad-night.png` — shown as full-cell background on dad's custody nights
- `mom-night.png` — shown as full-cell background on mom's custody nights
- `nurse-day.png` — shown as full-cell background on nurse days
- `favicon.png` — browser tab icon

## Deploying to Vercel

1. Push this folder to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. No build step needed — Vercel serves `index.html` directly
4. Set the domain to `family.ryanlongo.com` in Vercel project settings → Domains

## Triggering a Sync from FoxHole Desktop

1. Open FoxHole on your Mac
2. Go to the Planning Calendar view
3. Click the **Admin (gear)** menu in the top bar
4. Click **"Sync Family Calendar"**
5. A confirmation alert will show how many items were synced

The sync pushes ~3 months of past data plus 2 years of future data to Supabase, which the family calendar site reads via the public anon key.

## Data Source

The site reads from these public Supabase tables (read-only via anon key):
- `family_custody` — custody assignments per date
- `family_nurse_days` — nurse day dates
- `family_events` — family text and bar events
