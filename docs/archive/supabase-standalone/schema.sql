-- Core tables for standalone RHGO. Run in Supabase SQL editor.
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.specimens (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  created_by text,
  mineral_name text,
  found_at text,
  found_date timestamptz,
  rarity text,
  verified boolean default false,
  ai_confidence numeric,
  notes text,
  image_url text,
  created_date timestamptz default now()
);

create table if not exists public.hotspots (
  id uuid primary key default gen_random_uuid(),
  name text,
  state text,
  locality_name text,
  lat double precision,
  lng double precision,
  data jsonb default '{}'::jsonb,
  created_date timestamptz default now()
);

create table if not exists public.player_profiles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text,
  xp int default 0,
  level int default 1,
  data jsonb default '{}'::jsonb,
  created_date timestamptz default now()
);

create table if not exists public.quests (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text,
  status text default 'active',
  expires_at timestamptz,
  data jsonb default '{}'::jsonb,
  created_date timestamptz default now()
);

create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  owner_email text,
  name text,
  data jsonb default '{}'::jsonb,
  created_date timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.specimens enable row level security;
alter table public.player_profiles enable row level security;
alter table public.quests enable row level security;
alter table public.badges enable row level security;
alter table public.hotspots enable row level security;

create policy "own profile" on public.profiles for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "own specimens" on public.specimens for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own player" on public.player_profiles for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own quests" on public.quests for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "own badges" on public.badges for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "hotspots read" on public.hotspots for select using (true);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.player_profiles (owner_id, owner_email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
