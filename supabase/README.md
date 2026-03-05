# Supabase Setup (Auth + Profiles)

## Required env vars

```env
NEXT_PUBLIC_AUTH_PROVIDER=supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

## Database

Apply migration:

- `supabase/migrations/20260222160000_create_profiles.sql`

This creates:

- `public.profiles` (1:1 with `auth.users`)
- unique display name (case-insensitive)
- RLS policies:
  - public `SELECT`
  - owner-only `INSERT/UPDATE/DELETE`

## API routes

- `POST /api/auth/supabase/signup`
- `POST /api/auth/supabase/signin`
- `GET /api/auth/supabase/session`
- `POST /api/auth/supabase/logout`
- `GET /api/auth/supabase/display-name`
- `POST /api/auth/supabase/complete-profile`

## Notes

- `display_name` is validated server-side and in DB (`CHECK` + unique index).
- Availability checks are UX only; DB unique index is final authority.
- If signup succeeds but `display_name` conflicts during profile insert, API returns:
  - `code: "display_name_taken"`
  - `needsProfileCompletion: true`
