-- =============================================================
-- Lock app_state down to a single authenticated user via RLS.
-- Idempotent: safe to paste into the Supabase SQL editor and
-- re-run any number of times.
--
-- Do this FIRST, before running this script:
--   1. Supabase Dashboard -> Authentication -> Users -> Add user.
--      Enter your email + a real password.
--   2. Click into the new user, copy its "User UID".
--   3. Replace 'PASTE-YOUR-USER-UID-HERE' below with that UID.
-- Then paste the whole script into the SQL editor and run it once
-- -- the column add, backfill, RLS enable, and policies all apply
-- together. (If you run it before you have a UID, the backfill
-- step is safely skipped and you can re-run later once you do.)
-- =============================================================

-- ---- 1. Add the ownership column (nullable for now) ----------
alter table public.app_state
  add column if not exists user_id uuid references auth.users(id) default auth.uid();

-- ---- 2. Backfill existing rows to your account ----------------
-- Replace 'PASTE-YOUR-USER-UID-HERE' with the UID from
-- Authentication -> Users in the Supabase dashboard, then re-run
-- this script. Left as a no-op placeholder until you do.
do $$
begin
  if '58918540-1bbc-4d56-93ce-c2152066dae0' !~ '^[0-9a-fA-F-]{36}$' then
    raise notice 'Skipping backfill: replace the placeholder UID at the top of step 2 with your real user UID, then re-run this script.';
  else
    update public.app_state
      set user_id = '58918540-1bbc-4d56-93ce-c2152066dae0'::uuid
      where user_id is null;
  end if;
end $$;

-- ---- 3. Enable RLS (idempotent) --------------------------------
alter table public.app_state enable row level security;

-- ---- 4. Policies scoped to auth.uid() = user_id -----------------
drop policy if exists app_state_select_own on public.app_state;
create policy app_state_select_own on public.app_state
  for select using (auth.uid() = user_id);

drop policy if exists app_state_insert_own on public.app_state;
create policy app_state_insert_own on public.app_state
  for insert with check (auth.uid() = user_id);

drop policy if exists app_state_update_own on public.app_state;
create policy app_state_update_own on public.app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists app_state_delete_own on public.app_state;
create policy app_state_delete_own on public.app_state
  for delete using (auth.uid() = user_id);
