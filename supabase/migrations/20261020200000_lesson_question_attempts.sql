create table if not exists public.lesson_question_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id text not null,
  selected_index smallint not null check (selected_index between 0 and 3),
  xp_awarded smallint not null check (xp_awarded in (0, 5, 10)),
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

alter table public.lesson_question_attempts enable row level security;
create policy "Students can read their own lesson attempts"
  on public.lesson_question_attempts for select to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists lesson_question_attempts_user_answered_idx
  on public.lesson_question_attempts (user_id, answered_at desc);
