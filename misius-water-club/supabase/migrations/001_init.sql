-- Misiu's Water Club: initial schema
-- Run in Supabase: SQL Editor > New query > paste > Run

create extension if not exists pgcrypto;

-- ───────── Tables ─────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Misiu',
  created_at timestamptz not null default now()
);

create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_goal_ml int not null default 2000 check (daily_goal_ml between 500 and 6000),
  timezone text not null default 'Europe/Warsaw',
  quiet_start time not null default '22:00',
  quiet_end time not null default '08:00',
  reminders_enabled boolean not null default false,
  reminder_interval_min int not null default 120 check (reminder_interval_min between 30 and 480),
  updated_at timestamptz not null default now()
);

create table public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount_ml int not null check (amount_ml > 0 and amount_ml <= 2000),
  logged_at timestamptz not null default now(),
  local_date date not null -- set by trigger from the user's timezone
);
create index water_logs_user_date_idx on public.water_logs (user_id, local_date);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create table public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_key text not null,
  sent_at timestamptz not null default now()
);
create index reminder_log_user_sent_idx on public.reminder_log (user_id, sent_at desc);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  report_date date not null,
  total_ml int not null,
  goal_ml int not null,
  drinks int not null,
  created_at timestamptz not null default now(),
  unique (user_id, report_date)
);

create table public.billie_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  milestone text check (milestone in ('any','first_sip','p25','p50','p75','p100')) default 'any',
  created_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  key text not null,
  earned_at timestamptz not null default now(),
  unique (user_id, key)
);

-- ───────── Row-level security: each user sees only their own rows ─────────
do $$
declare t text;
begin
  foreach t in array array['settings','water_logs','push_subscriptions','reminder_log','reports','billie_messages','achievements']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());

-- ───────── Triggers ─────────
-- Compute local_date from the user's timezone so "midnight reset" is correct per timezone.
create or replace function public.set_water_local_date() returns trigger
language plpgsql as $$
declare tz text;
begin
  select timezone into tz from public.settings where user_id = new.user_id;
  new.local_date := (new.logged_at at time zone coalesce(tz, 'UTC'))::date;
  return new;
end $$;

create trigger water_logs_local_date
before insert or update of logged_at on public.water_logs
for each row execute function public.set_water_local_date();

-- On signup: create profile, default settings, and seed Billie's messages.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id);
  insert into public.settings (user_id) values (new.id);
  insert into public.billie_messages (user_id, body, milestone) values
    (new.id, 'I wish I could bring you a glass of water right now.', 'any'),
    (new.id, 'If I were there, I''d be personally supervising your hydration.', 'any'),
    (new.id, 'Your favourite Thai girl is thinking about you.', 'any'),
    (new.id, 'Drink water, eat properly and take care of yourself for me.', 'any'),
    (new.id, 'Even when I''m not there, I''m still looking after you.', 'any'),
    (new.id, 'You are my favourite notification.', 'any'),
    (new.id, 'A little reminder that someone in Thailand loves you.', 'any'),
    (new.id, 'First sip of the day! I''m already proud of you.', 'first_sip'),
    (new.id, 'Halfway there, handsome. Keep going!', 'p50'),
    (new.id, 'Goal reached! Kisses from Thailand. 😘', 'p100');
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
