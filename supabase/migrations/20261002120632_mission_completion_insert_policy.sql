grant insert on table public.learning_mission_completions to authenticated;

drop policy if exists "Students can record their own learning missions" on public.learning_mission_completions;
create policy "Students can record their own learning missions"
  on public.learning_mission_completions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);
