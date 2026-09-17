# RockHound-GO standalone (off Base44)

This branch starts the move off Base44.

## Stack
- Host: Vercel
- Auth + DB + Storage: Supabase
- App: existing Vite/React (unchanged UI)

## You must create (I cannot do this without your login)
1. https://supabase.com → New project `rhgo`
2. Authentication → Providers → enable **Email** (confirm email optional for now)
3. Also enable Google / Facebook if you want those buttons
4. SQL editor → paste `supabase/schema.sql`
5. Project Settings → API → copy URL + anon key

## Env (Vercel + `.env.local`)
```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

When `VITE_BACKEND` is unset, the app still uses Base44 (current rhgo.me).
When set to `supabase`, login/register/me/logout use Supabase.

## Cutover order
1. Create Supabase project + run schema
2. Put keys in Vercel
3. Deploy this branch to a preview URL
4. Test email signup on the preview
5. Export Base44 data → import to Postgres
6. Point rhgo.me DNS at Vercel
7. Leave Base44 up until data matches

Entities not fully mapped yet stay on Base44 until ported.
