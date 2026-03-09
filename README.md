# Project HQ (Private)

Private version of Project HQ dashboard.

## Goals
- Keep GitHub Pages dashboard as a backup (public-ish)
- Deploy this to Vercel with real auth (Supabase) so data isn't publicly fetchable

## Dev
```bash
npm i
npm run dev
```

## Planned env vars
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only)
- PROJECT_HQ_ADMIN_EMAIL
