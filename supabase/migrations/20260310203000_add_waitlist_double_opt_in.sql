alter table public.waitlist
  add column if not exists status text,
  add column if not exists confirmation_token text,
  add column if not exists confirmation_sent_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists confirmed_position bigint;

update public.waitlist
set status = 'confirmed'
where status is null;

update public.waitlist
set confirmed_position = waitlist_position
where confirmed_position is null;

update public.waitlist
set confirmed_at = coalesce(confirmed_at, created_at)
where status = 'confirmed'
  and confirmed_at is null;

alter table public.waitlist
  alter column status set not null;

alter table public.waitlist
  alter column status set default 'pending';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'waitlist_status_check'
  ) then
    alter table public.waitlist
      add constraint waitlist_status_check
      check (status in ('pending', 'confirmed'));
  end if;
end $$;

create unique index if not exists waitlist_confirmation_token_key
  on public.waitlist (confirmation_token)
  where confirmation_token is not null;

create unique index if not exists waitlist_confirmed_position_key
  on public.waitlist (confirmed_position)
  where confirmed_position is not null;

create index if not exists waitlist_status_idx
  on public.waitlist (status);
