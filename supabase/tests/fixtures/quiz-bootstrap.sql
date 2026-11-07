-- Esquema mínimo de teste. Não representa toda a stack Supabase.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create table auth.users (id uuid primary key, aud text, role text, email text, encrypted_password text);
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;
grant usage on schema auth to authenticated;
grant execute on function auth.uid() to authenticated;
create table public.access_levels (id uuid primary key, slug text not null, name text not null);
create type public.entitlement_status as enum ('pending','active','revoked','expired');
create table public.entitlements (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id), access_level_id uuid not null references public.access_levels(id), status public.entitlement_status not null, expires_at timestamptz);
create table public.student_profiles (user_id uuid primary key references auth.users(id), display_name text, full_name text, country text, favorite_programs text[]);
