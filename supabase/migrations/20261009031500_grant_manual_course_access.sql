-- Manual grants are intentionally separate from Kiwify orders. They let the
-- owner invite a person without making a fictitious payment record.
create table if not exists public.manual_course_grants (
  id uuid primary key default gen_random_uuid(),
  recipient_email text not null unique,
  status text not null default 'active' check (status in ('active', 'revoked')),
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_course_grants_active_email_idx
  on public.manual_course_grants (lower(recipient_email))
  where status = 'active';

alter table public.manual_course_grants enable row level security;

create or replace function public.claim_kiwify_access(p_user_id uuid, p_email text)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  order_row public.kiwify_orders%rowtype;
  manual_grant_row public.manual_course_grants%rowtype;
  course_access_level_id uuid;
begin
  select id into course_access_level_id
    from public.access_levels where slug = 'course-complete' limit 1;

  if course_access_level_id is null then
    raise exception 'course-complete access level is missing';
  end if;

  select * into manual_grant_row
    from public.manual_course_grants
   where lower(recipient_email) = lower(p_email)
     and status = 'active'
     and (user_id is null or user_id = p_user_id)
   limit 1 for update;

  if found then
    insert into public.entitlements (user_id, access_level_id, status, provider, provider_reference)
    values (p_user_id, course_access_level_id, 'active', 'manual', 'manual:' || manual_grant_row.id::text)
    on conflict (provider_reference) do update set
      user_id = excluded.user_id,
      access_level_id = excluded.access_level_id,
      status = 'active',
      updated_at = now();

    update public.manual_course_grants
       set user_id = p_user_id, updated_at = now()
     where id = manual_grant_row.id;
    return 'granted';
  end if;

  select * into order_row
    from public.kiwify_orders
   where lower(buyer_email) = lower(p_email)
     and status = 'active'
     and (user_id is null or user_id = p_user_id)
   order by provider_occurred_at desc
   limit 1 for update;

  if not found then return 'pending'; end if;

  insert into public.entitlements (user_id, access_level_id, status, provider, provider_reference)
  values (p_user_id, course_access_level_id, 'active', 'kiwify', order_row.purchase_id)
  on conflict (provider_reference) do update set
    user_id = excluded.user_id,
    access_level_id = excluded.access_level_id,
    status = 'active',
    updated_at = now();

  update public.kiwify_orders set user_id = p_user_id, updated_at = now() where id = order_row.id;
  return 'granted';
end;
$$;

revoke all on function public.claim_kiwify_access(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_kiwify_access(uuid, text) to service_role;
