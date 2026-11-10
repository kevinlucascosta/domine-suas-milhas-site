-- Somente para o projeto vazio milhas-rotadas-testes (eejtatjyuivvvdgavoec).
-- Não aplicar em produção nem reutilizar a fixture simplificada de Auth do quiz.
-- Estrutura de access_levels/entitlements conferida por metadados, sem copiar linhas.
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'public') then
    raise exception 'O bootstrap de pagamento exige schema public sem tabelas';
  end if;
  if to_regclass('auth.users') is null or to_regprocedure('auth.uid()') is null then
    raise exception 'O bootstrap exige o Auth real do Supabase';
  end if;
end;
$$;

create type public.entitlement_status as enum ('pending', 'active', 'revoked', 'expired');

create table public.access_levels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level_id uuid not null references public.access_levels(id),
  status public.entitlement_status not null default 'pending',
  provider text,
  provider_reference text unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.access_levels enable row level security;
alter table public.entitlements enable row level security;

revoke all on public.access_levels, public.entitlements from public, anon, authenticated;
grant usage on schema public to authenticated, service_role;
grant select on public.access_levels, public.entitlements to authenticated;
grant select on public.access_levels to service_role;
grant select, insert, update on public.entitlements to service_role;

create policy access_levels_select_authenticated on public.access_levels
  for select to authenticated using (true);
create policy entitlements_select_own on public.entitlements
  for select to authenticated using ((select auth.uid()) = user_id);

-- Catálogo de teste; nenhum aluno, pedido ou concessão real é copiado.
insert into public.access_levels (slug, name)
values ('course-complete', 'Curso completo — ambiente de testes');
