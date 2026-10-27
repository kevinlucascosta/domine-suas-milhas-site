-- Mission completion stays available only to an authenticated student and
-- derives both the student id and XP amount inside the database function.
-- Direct browser writes are revoked so the client cannot submit those fields.
revoke all on function public.complete_learning_mission(text) from public, anon;
grant execute on function public.complete_learning_mission(text) to authenticated;

drop policy if exists "Students can record their own learning missions" on public.learning_mission_completions;
revoke insert on table public.learning_mission_completions from authenticated;
