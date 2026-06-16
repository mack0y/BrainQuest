-- ═══════════════════════════════════════════
-- BrainQuest – Supabase Schema (Phase 1)
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";

-- ═══════════════════════════════════════════
-- 1. PROFILES (extends auth.users)
-- ═══════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  display_name text,
  avatar_url  text default '🧙',
  level       integer default 0,
  xp          integer default 0,
  total_xp    integer default 0,
  streak_days integer default 0,
  last_login  date,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    coalesce(new.raw_user_meta_data->>'full_name', 'Young Scholar')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ═══════════════════════════════════════════
-- 2. QUESTS
-- ═══════════════════════════════════════════
create table if not exists public.quests (
  id               bigserial primary key,
  level            integer not null,
  title            text not null,
  description      text,
  subject          text,
  xp_reward        integer not null default 100,
  required_quest_id bigint references public.quests(id),
  icon             text default '⚔️',
  sort_order       integer,
  created_at       timestamptz default now()
);

-- ═══════════════════════════════════════════
-- 3. QUEST PROGRESS
-- ═══════════════════════════════════════════
create table if not exists public.quest_progress (
  id          bigserial primary key,
  user_id     uuid references public.profiles(id) on delete cascade not null,
  quest_id    bigint references public.quests(id) on delete cascade not null,
  status      text default 'locked' check (status in ('locked','available','in_progress','completed')),
  completed_at timestamptz,
  created_at  timestamptz default now(),
  unique(user_id, quest_id)
);

-- ═══════════════════════════════════════════
-- 4. WORKSHEETS
-- ═══════════════════════════════════════════
create table if not exists public.worksheets (
  id          bigserial primary key,
  title       text not null,
  subject     text not null,
  grade       text not null,
  difficulty  text default 'easy' check (difficulty in ('easy','normal','hard','legendary')),
  content     jsonb,
  xp_reward   integer default 50,
  quest_id    bigint references public.quests(id),
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════
-- 5. WORKSHEET COMPLETIONS
-- ═══════════════════════════════════════════
create table if not exists public.worksheet_completions (
  id            bigserial primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  worksheet_id  bigint references public.worksheets(id) on delete cascade not null,
  score         integer,
  xp_earned     integer default 0,
  completed_at  timestamptz default now()
);

-- ═══════════════════════════════════════════
-- 6. BADGES
-- ═══════════════════════════════════════════
create table if not exists public.badges (
  id                bigserial primary key,
  name              text not null,
  description       text,
  icon              text,
  requirement_type  text,
  requirement_value integer,
  created_at        timestamptz default now()
);

-- ═══════════════════════════════════════════
-- 7. USER BADGES
-- ═══════════════════════════════════════════
create table if not exists public.user_badges (
  id        bigserial primary key,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  badge_id  bigint references public.badges(id) on delete cascade not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

-- ═══════════════════════════════════════════
-- 8. STUDY SQUADS
-- ═══════════════════════════════════════════
create table if not exists public.study_squads (
  id          bigserial primary key,
  name        text not null,
  invite_code text unique default encode(gen_random_bytes(4), 'hex'),
  created_by  uuid references public.profiles(id) not null,
  created_at  timestamptz default now()
);

-- ═══════════════════════════════════════════
-- 9. SQUAD MEMBERS
-- ═══════════════════════════════════════════
create table if not exists public.squad_members (
  id        bigserial primary key,
  squad_id  bigint references public.study_squads(id) on delete cascade not null,
  user_id   uuid references public.profiles(id) on delete cascade not null,
  role      text default 'member' check (role in ('leader','member')),
  joined_at timestamptz default now(),
  unique(squad_id, user_id)
);

-- ═══════════════════════════════════════════
-- 10. FAMILY RELATIONSHIPS
-- ═══════════════════════════════════════════
create table if not exists public.family_relationships (
  id          bigserial primary key,
  parent_id   uuid references public.profiles(id) on delete cascade not null,
  child_id    uuid references public.profiles(id) on delete cascade not null,
  approved    boolean default false,
  created_at  timestamptz default now(),
  unique(parent_id, child_id)
);

-- ═══════════════════════════════════════════
-- 11. SUBSCRIPTIONS
-- ═══════════════════════════════════════════
create table if not exists public.subscriptions (
  id                 bigserial primary key,
  user_id            uuid references public.profiles(id) on delete cascade not null unique,
  tier               text default 'free' check (tier in ('free','premium','school')),
  stripe_customer_id text,
  stripe_sub_id      text,
  expires_at         timestamptz,
  created_at         timestamptz default now()
);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Quests (public read)
alter table public.quests enable row level security;
create policy "Anyone can view quests"
  on public.quests for select using (true);

-- Quest progress (own only)
alter table public.quest_progress enable row level security;
create policy "Users can view own quest progress"
  on public.quest_progress for select using (auth.uid() = user_id);
create policy "Users can insert own quest progress"
  on public.quest_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own quest progress"
  on public.quest_progress for update using (auth.uid() = user_id);

-- Worksheets (public read)
alter table public.worksheets enable row level security;
create policy "Anyone can view worksheets"
  on public.worksheets for select using (true);

-- Worksheet completions (own only)
alter table public.worksheet_completions enable row level security;
create policy "Users can view own completions"
  on public.worksheet_completions for select using (auth.uid() = user_id);
create policy "Users can insert own completions"
  on public.worksheet_completions for insert with check (auth.uid() = user_id);

-- Badges (public read)
alter table public.badges enable row level security;
create policy "Anyone can view badges"
  on public.badges for select using (true);

-- User badges (own view)
alter table public.user_badges enable row level security;
create policy "Users can view own badges"
  on public.user_badges for select using (auth.uid() = user_id);
create policy "System can insert badges"
  on public.user_badges for insert with check (auth.uid() = user_id);

-- Squads
alter table public.study_squads enable row level security;
create policy "Users can view squads they belong to"
  on public.study_squads for select using (
    auth.uid() in (select user_id from public.squad_members where squad_id = id)
    or created_by = auth.uid()
  );

-- Squad members
alter table public.squad_members enable row level security;
create policy "Users can view own squad memberships"
  on public.squad_members for select using (auth.uid() = user_id);

-- Family relationships
alter table public.family_relationships enable row level security;
create policy "Users can view own family"
  on public.family_relationships for select using (auth.uid() = parent_id or auth.uid() = child_id);

-- Subscriptions
alter table public.subscriptions enable row level security;
create policy "Users can view own subscription"
  on public.subscriptions for select using (auth.uid() = user_id);

-- ═══════════════════════════════════════════
-- SEED DATA
-- ═══════════════════════════════════════════

-- Quests (6 levels)
insert into public.quests (level, title, description, subject, xp_reward, icon, sort_order) values
  (0, '🌱 The Beginning', 'Take your very first step! Learn how to hold a pencil, trace basic lines, and recognize the letters A, B, C.', 'General', 100, '🌱', 1),
  (1, '🔤 Alphabet Explorer', 'Trace all 26 letters A–Z in uppercase and lowercase. Master letter sounds and start connecting letters to words.', 'Alphabets', 150, '🔤', 2),
  (2, '🔢 Number Knight', 'Write numbers 1–20, count objects, and match numbers to groups. Unlock the power of counting!', 'Numbers', 150, '🔢', 3),
  (3, '➕ Math Warrior', 'Conquer addition and subtraction up to 20. Solve word problems and defeat the math monsters!', 'Maths', 200, '➕', 4),
  (4, '📖 Word Wizard', 'Build your word power! Sight words, word search, and spelling challenges await the brave Word Wizard.', 'Vocabulary', 200, '📖', 5),
  (5, '✖️ Multiplication Master', 'Times tables, skip counting, and division await. Only the bravest scholars make it this far!', 'Maths', 300, '✖️', 6)
on conflict do nothing;

-- Badges
insert into public.badges (name, description, icon, requirement_type, requirement_value) values
  ('First Steps', 'Complete Level 0', '🌱', 'quest_complete', 0),
  ('ABC Hero', 'Finish Alphabet Realm', '🔤', 'quest_complete', 1),
  ('Number Knight', 'Reach Level 2', '🔢', 'level_reach', 2),
  ('On Fire!', '7-day streak', '🔥', 'streak', 7),
  ('Math Wizard', 'Reach Level 5', '🧙', 'level_reach', 5),
  ('Star Scholar', 'Earn 1000 XP', '⭐', 'total_xp', 1000),
  ('Quest King', 'Complete all quests', '👑', 'all_quests', 6),
  ('Grand Champion', 'Top of Leaderboard', '🏆', 'leaderboard_top', 1)
on conflict do nothing;
