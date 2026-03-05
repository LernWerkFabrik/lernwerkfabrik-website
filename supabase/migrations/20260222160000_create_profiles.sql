-- Profiles for public display names + optional job context.
-- Run with Supabase migrations (or paste into SQL editor once).

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  job text,
  apprenticeship_year int,
  company text,
  display_name_changed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_format_chk
    check (display_name ~ '^[a-z0-9._]{3,20}$')
);

-- Case-insensitive uniqueness protection.
create unique index if not exists profiles_display_name_unique_lower_idx
  on public.profiles (lower(display_name));

create index if not exists profiles_created_at_idx
  on public.profiles (created_at desc);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

-- Public read for visible display names/team context.
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
on public.profiles
for select
using (true);

-- Only owner can insert/update/delete own profile.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own"
on public.profiles
for delete
using (auth.uid() = id);
