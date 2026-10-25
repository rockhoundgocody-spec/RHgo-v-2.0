# RockHound-GO standalone

Project: `ooswefjhwanailebjrkq`
URL: https://ooswefjhwanailebjrkq.supabase.co

Frontend uses `@supabase/supabase-js` (not `@supabase/server` — that is for Edge/API only).

## Local / Vercel env
```
VITE_BACKEND=supabase
VITE_SUPABASE_URL=https://ooswefjhwanailebjrkq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_--znZ5PXuzO3fcxOh-sDhA_xcueq3uH
```

Secret key stays in Supabase / server env only. Do not put it in Vite.

## Still required in dashboard
1. Auth → Email provider ON
2. Run `supabase/schema.sql`
3. `npm i @supabase/supabase-js`
4. Deploy this branch with `VITE_BACKEND=supabase`
