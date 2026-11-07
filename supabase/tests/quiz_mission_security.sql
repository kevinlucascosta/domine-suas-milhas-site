-- Execute apenas em banco isolado descartável, após a etapa aditiva E supabase/rollout/module-01-quiz/contract.sql.
begin;
insert into auth.users (id, aud, role, email, encrypted_password) values
  ('00000000-0000-4000-8000-000000000101', 'authenticated', 'authenticated', 'quiz-security-1@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000102', 'authenticated', 'authenticated', 'quiz-security-2@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000103', 'authenticated', 'authenticated', 'quiz-security-3@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000104', 'authenticated', 'authenticated', 'quiz-security-4@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000105', 'authenticated', 'authenticated', 'quiz-security-5@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000106', 'authenticated', 'authenticated', 'quiz-security-6@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000107', 'authenticated', 'authenticated', 'quiz-security-7@example.invalid', ''),
  ('00000000-0000-4000-8000-000000000108', 'authenticated', 'authenticated', 'quiz-security-8@example.invalid', '');
insert into public.access_levels (id, slug, name)
values ('00000000-0000-4000-8000-000000000201', 'quiz-security-test', 'Quiz security test');
insert into public.entitlements (user_id, access_level_id, status, expires_at) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'active', null),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000201', 'active', now() + interval '1 day'),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000201', 'active', null),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000201', 'active', null),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000201', 'revoked', null),
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000201', 'expired', null),
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000201', 'active', now() - interval '1 second');
insert into public.learning_mission_completions (user_id, mission_key, xp_earned)
values ('00000000-0000-4000-8000-000000000106', 'quiz_module_01_complete', 150);
insert into public.quiz_attempt_locks (user_id, quiz_key, locked_until)
values
  ('00000000-0000-4000-8000-000000000103', 'module_01_question_01', now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000104', 'module_01_question_01', now() + interval '300 years');
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000101', true);
do $$
declare r record; v_no_access uuid;
begin
  begin
    insert into public.quiz_attempt_locks (user_id, quiz_key, locked_until)
    values (auth.uid(), 'module_01_question_01', now());
    raise exception 'A inserção direta de bloqueio deve ser proibida';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.submit_module_01_quiz_answer(null::smallint, true);
    raise exception 'Resposta nula foi aceita';
  exception when raise_exception then
    if sqlerrm <> 'invalid_quiz_answer' then raise; end if;
  end;
  begin
    perform public.complete_learning_mission('quiz_module_01_complete');
    raise exception 'A chamada antiga concedeu XP sem resposta';
  exception when raise_exception then
    if sqlerrm <> 'quiz_answer_required' then raise; end if;
  end;
  select * into r from public.submit_module_01_quiz_answer(0::smallint, false);
  if r.correct is distinct from false or r.locked_until is null or r.retry_after_seconds is distinct from 86400 or r.attempt_recorded is distinct from true then
    raise exception 'Resposta incorreta deve iniciar bloqueio';
  end if;
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.correct is distinct from false or r.locked_until is null or r.xp_earned is not null or r.attempt_recorded is distinct from false then
    raise exception 'Bloqueio deve impedir resposta correta';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000102', true);
  select * into r from public.submit_module_01_quiz_answer(1::smallint, false);
  if r.correct is distinct from true or r.xp_earned is not null or r.attempt_recorded is distinct from false then
    raise exception 'Selecionar resposta correta não deve conceder XP';
  end if;
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.correct is distinct from true or r.xp_earned is distinct from 150 or r.newly_completed is distinct from true or r.attempt_recorded is distinct from false then
    raise exception 'Conclusão correta deve conceder 150 XP';
  end if;
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.xp_earned is distinct from 150 or r.newly_completed is distinct from false then
    raise exception 'Repetir conclusão não deve conceder XP novamente';
  end if;
  select * into r from public.complete_learning_mission('quiz_module_01_complete');
  if r.xp_earned is distinct from 150 or r.newly_completed is distinct from false then
    raise exception 'Conquistas anteriores devem continuar acessíveis';
  end if;
  select * into r from public.submit_module_01_quiz_answer(0::smallint, false);
  if r.correct is distinct from false or r.locked_until is null or r.xp_earned is not null or r.attempt_recorded is distinct from true then
    raise exception 'Resposta incorreta deve bloquear mesmo após a conclusão anterior';
  end if;
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.correct is distinct from false or r.locked_until is null or r.attempt_recorded is distinct from false then
    raise exception 'Conclusão anterior não deve ignorar bloqueio recente';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000103', true);
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.correct is distinct from false or r.retry_after_seconds is null or r.retry_after_seconds <= 0 or r.xp_earned is not null or r.attempt_recorded is distinct from false then
    raise exception 'Bloqueio anterior deve continuar válido';
  end if;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000104', true);
  select * into r from public.submit_module_01_quiz_answer(1::smallint, true);
  if r.correct is distinct from false or r.retry_after_seconds is distinct from 2147483647 or r.locked_until is null or r.attempt_recorded is distinct from false then
    raise exception 'Bloqueio antigo muito distante não deve causar estouro de inteiro';
  end if;
  foreach v_no_access in array array[
    '00000000-0000-4000-8000-000000000105'::uuid,
    '00000000-0000-4000-8000-000000000106'::uuid,
    '00000000-0000-4000-8000-000000000107'::uuid,
    '00000000-0000-4000-8000-000000000108'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', v_no_access::text, true);
    begin
      perform public.submit_module_01_quiz_answer(1::smallint, true);
      raise exception 'Quiz aceitou acesso ausente, revogado ou expirado';
    exception when raise_exception then
      if sqlerrm is distinct from 'course_access_required' then raise; end if;
    end;
  end loop;
  perform set_config('request.jwt.claim.sub', '00000000-0000-4000-8000-000000000106', true);
  select * into r from public.complete_learning_mission('quiz_module_01_complete');
  if r.xp_earned is distinct from 150 or r.newly_completed is distinct from false then
    raise exception 'XP existente deve permanecer acessível após revogação';
  end if;
end;
$$;
rollback;
