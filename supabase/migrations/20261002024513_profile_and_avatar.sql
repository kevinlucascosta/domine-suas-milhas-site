create table if not exists public.student_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 2 and 60),
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  country text not null default 'Brasil' check (country in ('Brasil', 'Portugal', 'Estados Unidos', 'Espanha', 'Japão', 'China', 'Outro')),
  favorite_programs text[] not null default '{}',
  language_code text not null default 'pt-BR' check (language_code in ('pt-BR', 'en', 'pt-PT', 'es', 'ja', 'zh')),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint favorite_programs_allowed check (favorite_programs <@ array['Livelo', 'Smiles', 'TudoAzul', 'LATAM Pass', 'Esfera', 'Outro']::text[])
);

alter table public.student_profiles enable row level security;

drop policy if exists "Students can read their own profile" on public.student_profiles;
drop policy if exists "Students can create their own profile" on public.student_profiles;
drop policy if exists "Students can update their own profile" on public.student_profiles;

create policy "Students can read their own profile"
  on public.student_profiles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can create their own profile"
  on public.student_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update their own profile"
  on public.student_profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "Students can upload their own avatar" on storage.objects;
drop policy if exists "Students can view their own avatar" on storage.objects;
drop policy if exists "Students can update their own avatar" on storage.objects;
drop policy if exists "Students can delete their own avatar" on storage.objects;

create policy "Students can upload their own avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Students can view their own avatar"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Students can update their own avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Students can delete their own avatar"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
