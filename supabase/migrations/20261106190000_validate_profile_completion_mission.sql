-- Existing achievements stay immutable; only a new profile mission requires
-- the same server-stored profile fields that the client considers complete.
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

  select completion.xp_earned, completion.completed_at
    into v_xp, v_completed_at
    from public.learning_mission_completions as completion
    where completion.user_id = v_user_id and completion.mission_key = p_mission_key;

  if found then
    return query select p_mission_key, v_xp, v_completed_at, false;
    return;
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

  if p_mission_key = 'profile_complete' and not exists (
    select 1
    from public.student_profiles as profile
    where profile.user_id = v_user_id
      and char_length(trim(profile.display_name)) >= 2
      and char_length(trim(profile.full_name)) >= 2
      and coalesce(trim(profile.country), '') <> ''
      and coalesce(cardinality(profile.favorite_programs), 0) > 0
  ) then
    raise exception 'profile_incomplete';
  end if;

  insert into public.learning_mission_completions as completion (user_id, mission_key, xp_earned)
  values (v_user_id, p_mission_key, v_xp)
  on conflict on constraint learning_mission_completions_pkey do nothing
  returning completion.completed_at into v_completed_at;

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

revoke all on function public.complete_learning_mission(text) from public, anon;
grant execute on function public.complete_learning_mission(text) to authenticated;
