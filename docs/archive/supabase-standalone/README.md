# Archived: Supabase "standalone" backend

`schema.sql` is the data model for an experimental standalone backend that
would have replaced Base44 with Supabase (six tables, RLS policies, and a
signup trigger).

**It is not used by the app.** The client that talked to it
(`src/api/standaloneClient.js`) and the `@supabase/supabase-js` dependency were
removed in commit `a04eac5` ("Optimize bundle size and remove unused
dependencies"). Nothing in `src/` imports Supabase, and `VITE_BACKEND` is no
longer read anywhere. The app's backend is Base44 (`base44/`).

It is kept here only as a design reference in case an own-server backend is
revisited. If it is ever revived, note that it models 6 of the 41 Base44
entities, so it is a starting point rather than a drop-in replacement, and the
`handle_new_user()` trigger function should set an explicit
`search_path` (it is `security definer`).

The old `standalone/README.md` was removed: it described setup steps for the
deleted client and embedded a project URL and publishable key.
