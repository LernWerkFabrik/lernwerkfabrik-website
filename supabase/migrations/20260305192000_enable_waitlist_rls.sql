alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon;
revoke all on table public.waitlist from authenticated;
