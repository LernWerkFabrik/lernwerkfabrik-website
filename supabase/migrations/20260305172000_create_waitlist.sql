create extension if not exists "pgcrypto";

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now(),
  source text,
  referrer text,
  device_type text,
  country text,
  waitlist_position bigint generated always as identity unique not null
);

alter table public.waitlist
  add column if not exists source text,
  add column if not exists referrer text,
  add column if not exists device_type text,
  add column if not exists country text;

alter table public.waitlist
  add column if not exists waitlist_position bigint generated always as identity;

create unique index if not exists waitlist_email_key on public.waitlist (email);
create unique index if not exists waitlist_waitlist_position_key on public.waitlist (waitlist_position);
create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
