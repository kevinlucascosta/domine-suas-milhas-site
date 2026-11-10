-- Etapa 1: adiciona o novo RPC sem retirar o contrato dos clientes antigos.
-- Publicar e validar o cliente novo antes do corte em supabase/rollout/module-01-quiz/contract.sql.
create or replace function public.submit_module_01_quiz_answer(
  p_selected_index smallint, p_finalize boolean
)
returns table (
  correct boolean, locked_until timestamptz, retry_after_seconds integer,
  mission_key text, xp_earned smallint, completed_at timestamptz, newly_completed boolean,
  attempt_recorded boolean
)
language plpgsql security definer set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_locked_until timestamptz;
  v_completed_at timestamptz;
  v_xp smallint;
  v_new boolean;
begin
  if v_user_id is null then raise exception 'not_authenticated'; end if;
  if not exists (
    select 1 from public.entitlements as entitlement
    where entitlement.user_id = v_user_id
      and entitlement.status = 'active'
      and (entitlement.expires_at is null or entitlement.expires_at > pg_catalog.now())
  ) then raise exception 'course_access_required'; end if;
  if p_selected_index is null or p_selected_index not between 0 and 3 or p_finalize is null then
    raise exception 'invalid_quiz_answer';
  end if;

  -- Serializa as tentativas concorrentes da mesma conta na mesma transação.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('module-01-quiz:' || v_user_id::text, 0));

  select max(locks.locked_until) into v_locked_until
  from public.quiz_attempt_locks as locks
  where locks.user_id = v_user_id and locks.quiz_key = 'module_01_question_01'
    and locks.locked_until > pg_catalog.now();
  if v_locked_until is not null then
    return query select false, v_locked_until,
      least(2147483647::numeric, pg_catalog.ceil(extract(epoch from (v_locked_until - pg_catalog.now()))))::integer,
      null::text, null::smallint, null::timestamptz, false, false;
    return;
  end if;

  if p_selected_index <> 1 then
    v_locked_until := pg_catalog.now() + interval '24 hours';
    insert into public.quiz_attempt_locks (user_id, quiz_key, locked_until)
    values (v_user_id, 'module_01_question_01', v_locked_until);
    return query select false, v_locked_until, 86400, null::text, null::smallint, null::timestamptz, false, true;
    return;
  end if;

  if not p_finalize then
    return query select true, null::timestamptz, 0, null::text, null::smallint, null::timestamptz, false, false;
    return;
  end if;

  insert into public.learning_mission_completions as completion (user_id, mission_key, xp_earned)
  values (v_user_id, 'quiz_module_01_complete', 150)
  on conflict on constraint learning_mission_completions_pkey do nothing
  returning completion.xp_earned, completion.completed_at into v_xp, v_completed_at;
  v_new := found;
  if not v_new then
    select completion.xp_earned, completion.completed_at into v_xp, v_completed_at
    from public.learning_mission_completions as completion
    where completion.user_id = v_user_id and completion.mission_key = 'quiz_module_01_complete';
  end if;
  return query select true, null::timestamptz, 0, 'quiz_module_01_complete'::text, v_xp, v_completed_at, v_new, false;
end;
$$;

revoke all on function public.submit_module_01_quiz_answer(smallint, boolean) from public, anon;
grant execute on function public.submit_module_01_quiz_answer(smallint, boolean) to authenticated;
