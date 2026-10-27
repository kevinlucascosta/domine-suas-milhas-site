drop policy if exists "Students can read their own XP events" on public.xp_events;
create policy "Students can read their own XP events"
  on public.xp_events for select to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.xp_events to authenticated;

drop function if exists public.record_lesson_question_attempt(text, smallint);

create function public.record_lesson_question_attempt(
  p_question_id text,
  p_selected_index smallint
)
returns table(
  question_id text,
  selected_index smallint,
  xp_awarded smallint,
  answered_at timestamptz,
  newly_answered boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_correct_index smallint;
  v_xp smallint;
  v_answered_at timestamptz := now();
  v_attempt public.lesson_question_attempts%rowtype;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  v_correct_index := case p_question_id
    when 'review-milhas-01' then 0 when 'review-milhas-02' then 0
    when 'review-milhas-03' then 2 when 'review-milhas-04' then 1
    when 'review-milhas-05' then 2 when 'review-programas-01' then 1
    when 'review-programas-02' then 0 when 'review-programas-03' then 2
    when 'review-programas-04' then 0 when 'review-programas-05' then 1
    when 'challenge-milhas-01' then 0 when 'challenge-milhas-02' then 1
    when 'challenge-milhas-03' then 1 when 'challenge-milhas-04' then 0
    when 'challenge-milhas-05' then 0 when 'challenge-programas-01' then 0
    when 'challenge-programas-02' then 0 when 'challenge-programas-03' then 0
    when 'challenge-programas-04' then 0 when 'challenge-programas-05' then 0
    else null
  end;

  if v_correct_index is null or p_selected_index not between 0 and 3 then
    raise exception 'invalid_question';
  end if;

  v_xp := case
    when p_selected_index = v_correct_index and p_question_id like 'review-%' then 5
    when p_selected_index = v_correct_index then 10
    else 0
  end;

  insert into public.lesson_question_attempts (
    user_id, question_id, selected_index, xp_awarded, answered_at
  ) values (
    v_user_id, p_question_id, p_selected_index, v_xp, v_answered_at
  )
  on conflict (user_id, question_id) do update
    set selected_index = excluded.selected_index,
        xp_awarded = excluded.xp_awarded,
        answered_at = excluded.answered_at
    where public.lesson_question_attempts.answered_at <=
      v_answered_at - interval '24 hours'
  returning * into v_attempt;

  if not found then
    select * into v_attempt
    from public.lesson_question_attempts
    where user_id = v_user_id and question_id = p_question_id;

    return query select
      v_attempt.question_id,
      v_attempt.selected_index,
      v_attempt.xp_awarded,
      v_attempt.answered_at,
      false;
    return;
  end if;

  if v_xp > 0 then
    insert into public.xp_events (user_id, source, points, idempotency_key, created_at)
    values (
      v_user_id,
      'lesson_01_question',
      v_xp,
      'lesson-question:' || v_user_id::text || ':' || p_question_id || ':' ||
        extract(epoch from v_answered_at)::bigint::text,
      v_answered_at
    );
  end if;

  return query select
    v_attempt.question_id,
    v_attempt.selected_index,
    v_attempt.xp_awarded,
    v_attempt.answered_at,
    true;
end;
$$;

revoke all on function public.record_lesson_question_attempt(text, smallint)
  from public, anon;
grant execute on function public.record_lesson_question_attempt(text, smallint)
  to authenticated;
