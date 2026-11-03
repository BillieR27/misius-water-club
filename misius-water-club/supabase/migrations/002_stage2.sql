-- Misiu's Water Club: Stage 2 migration (safe to run more than once)
-- Supabase: SQL Editor > New query > paste > Run

-- 1. Default daily goal is now 2,500 ml (still adjustable in Settings, 500-6000).
alter table public.settings alter column daily_goal_ml set default 2500;
-- Stage 1 had no goal setting yet, so any 2,000 is the untouched old default.
update public.settings set daily_goal_ml = 2500 where daily_goal_ml = 2000;

-- 2. Optional: Billie's WhatsApp number (digits only, with country code, e.g. 66812345678).
--    Left empty until it is entered in the app. Nothing is pre-filled.
alter table public.settings add column if not exists billie_whatsapp text;
alter table public.settings drop constraint if exists settings_billie_whatsapp_check;
alter table public.settings add constraint settings_billie_whatsapp_check
  check (billie_whatsapp is null or billie_whatsapp ~ '^[0-9]{6,15}$');

-- 3. Daily reports keep the full snapshot Karol shares.
alter table public.reports add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.reports add column if not exists shared_at timestamptz;
