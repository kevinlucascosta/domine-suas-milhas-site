create table if not exists public.quiz_attempt_locks (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_key text not null check (quiz_key in ('module_01_question_01')),
  locked_until timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists quiz_attempt_locks_user_quiz_locked_until_idx
  on public.quiz_attempt_locks (user_id, quiz_key, locked_until desc);

alter table public.quiz_attempt_locks enable row level security;

grant select, insert on table public.quiz_attempt_locks to authenticated;
grant usage, select on sequence public.quiz_attempt_locks_id_seq to authenticated;

drop policy if exists "Students can read their own quiz locks" on public.quiz_attempt_locks;
create policy "Students can read their own quiz locks"
  on public.quiz_attempt_locks for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Students can register their own quiz locks" on public.quiz_attempt_locks;
create policy "Students can register their own quiz locks"
  on public.quiz_attempt_locks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
  );
