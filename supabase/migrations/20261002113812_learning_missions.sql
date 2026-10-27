-- A completion is an immutable, per-student achievement. The server function
-- below is the only writer so XP values cannot be submitted from the browser.
create table if not exists public.learning_mission_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  mission_key text not null check (mission_key in (
    'profile_complete',
    'lesson_01_complete',
    'quiz_module_01_complete',
    'simulator_used'
  )),
  xp_earned smallint not null check (xp_earned in (20, 50, 100, 150)),
  completed_at timestamptz not null default now(),
  primary key (user_id, mission_key),
  check (
    (mission_key = 'profile_complete' and xp_earned = 20)
    or (mission_key = 'lesson_01_complete' and xp_earned = 50)
    or (mission_key = 'quiz_module_01_complete' and xp_earned = 150)
    or (mission_key = 'simulator_used' and xp_earned = 100)
  )
);

alter table public.learning_mission_completions enable row level security;

grant usage on schema public to authenticated;
grant select on table public.learning_mission_completions to authenticated;

drop policy if exists "Students can read their own learning missions" on public.learning_mission_completions;
create policy "Students can read their own learning missions"
  on public.learning_mission_completions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.complete_learning_mission(p_mission_key text)
returns table (mission_key text, xp_earned smallint, completed_at timestamptz, newly_completed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_xp smallint;
  v_completed_at timestamptz;
  v_new boolean := false;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  v_xp := case p_mission_key
    when 'profile_complete' then 20
    when 'lesson_01_complete' then 50
    when 'quiz_module_01_complete' then 150
    when 'simulator_used' then 100
    else null
  end;

  if v_xp is null then
    raise exception 'unsupported_mission';
  end if;

  insert into public.learning_mission_completions (user_id, mission_key, xp_earned)
  values (v_user_id, p_mission_key, v_xp)
  on conflict (user_id, mission_key) do nothing
  returning completed_at into v_completed_at;

  v_new := found;
  if not v_new then
    select completion.xp_earned, completion.completed_at
      into v_xp, v_completed_at
      from public.learning_mission_completions as completion
      where completion.user_id = v_user_id and completion.mission_key = p_mission_key;
  end if;

  return query select p_mission_key, v_xp, v_completed_at, v_new;
end;
$$;

revoke all on function public.complete_learning_mission(text) from public;
grant execute on function public.complete_learning_mission(text) to authenticated;
