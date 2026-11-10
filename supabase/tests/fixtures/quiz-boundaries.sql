begin;
insert into auth.users(id) values
('00000000-0000-4000-8000-000000000301'),
('00000000-0000-4000-8000-000000000302');
insert into public.access_levels(id,slug,name) values ('00000000-0000-4000-8000-000000000401','boundary-test','Boundary test');
insert into public.entitlements(user_id,access_level_id,status) values
('00000000-0000-4000-8000-000000000301','00000000-0000-4000-8000-000000000401','active');
insert into public.quiz_attempt_locks(user_id,quiz_key,locked_until) values
('00000000-0000-4000-8000-000000000301','module_01_question_01',now()-interval '1 second');
set local role anon;
do $$ begin
  begin
    perform public.submit_module_01_quiz_answer(1::smallint,true);
    raise exception 'Anon executou o quiz';
  exception when insufficient_privilege then null; end;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  begin
    perform public.submit_module_01_quiz_answer(1::smallint,true);
    raise exception 'Quiz aceitou ausência de usuário';
  exception when raise_exception then
    if sqlerrm <> 'not_authenticated' then raise; end if;
  end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000301',true);
do $$ declare r record; i smallint; begin
  foreach i in array array[-1,4]::smallint[] loop
    begin
      perform public.submit_module_01_quiz_answer(i,true);
      raise exception 'Índice inválido aceito';
    exception when raise_exception then if sqlerrm <> 'invalid_quiz_answer' then raise; end if; end;
  end loop;
  begin
    perform public.submit_module_01_quiz_answer(1::smallint,null);
    raise exception 'Finalização nula aceita';
  exception when raise_exception then if sqlerrm <> 'invalid_quiz_answer' then raise; end if; end;
  select * into r from public.submit_module_01_quiz_answer(1::smallint,true);
  if r.newly_completed is distinct from true then raise exception 'Bloqueio expirado impediu conclusão'; end if;
  perform public.submit_module_01_quiz_answer(1::smallint,true);
  if (select count(*) from public.learning_mission_completions where user_id=auth.uid()) <> 1 then raise exception 'Conclusão duplicada'; end if;
  begin
    insert into public.learning_mission_completions(user_id,mission_key,xp_earned) values(auth.uid(),'simulator_used',100);
    raise exception 'Inserção direta de XP aceita';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000302',true);
do $$ begin
  if exists(select 1 from public.learning_mission_completions) then raise exception 'XP de outra conta visível'; end if;
  if exists(select 1 from public.quiz_attempt_locks) then raise exception 'Bloqueio de outra conta visível'; end if;
end $$;
rollback;
