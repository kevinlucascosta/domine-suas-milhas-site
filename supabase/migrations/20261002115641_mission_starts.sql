create table if not exists public.learning_mission_starts (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null check (mission_key in (
    'profile_complete',
    'lesson_01_complete',
    'quiz_module_01_complete',
    'simulator_used'
  )),
  started_at timestamptz not null default now(),
  primary key (user_id, mission_key)
);

alter table public.learning_mission_starts enable row level security;

grant usage on schema public to authenticated;
grant select, insert on table public.learning_mission_starts to authenticated;

drop policy if exists "Students can read their own mission starts" on public.learning_mission_starts;
create policy "Students can read their own mission starts"
  on public.learning_mission_starts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can start their own missions" on public.learning_mission_starts;
create policy "Students can start their own missions"
  on public.learning_mission_starts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
