-- Kiwify is the source of truth for the purchase. A browser redirect never
-- grants access. This migration deliberately reuses the existing
-- access_levels/entitlements model from aulas_milhas_platform.

create table if not exists public.kiwify_orders (
  id uuid primary key default gen_random_uuid(),
  purchase_id text not null unique,
  buyer_email text not null,
  product_id text not null,
  status text not null check (status in ('active', 'revoked')),
  user_id uuid references auth.users(id) on delete set null,
  amount_cents integer,
  currency text not null default 'BRL',
  provider_occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kiwify_orders_active_email_idx
  on public.kiwify_orders (lower(buyer_email), provider_occurred_at desc)
  where status = 'active';

-- Keep only the delivery fingerprint. Raw checkout bodies contain personal
-- information and must not be persisted.
create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider = 'kiwify'),
  event_key text not null,
  event_type text not null,
  payload_sha256 text not null,
  received_at timestamptz not null default now(),
  unique (provider, event_key)
);

alter table public.kiwify_orders enable row level security;
alter table public.webhook_deliveries enable row level security;

-- All reads and writes go through the server's service-role client. No policy
-- is created for anon/authenticated users, so a student can never enumerate
-- orders or payment details.

create or replace function public.process_kiwify_event(
  p_event_key text,
  p_event_type text,
  p_payload_sha256 text,
  p_purchase_id text,
  p_buyer_email text,
  p_product_id text,
  p_status text,
  p_amount_cents integer,
  p_currency text,
  p_occurred_at timestamptz
)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  inserted_delivery boolean := false;
  linked_user_id uuid;
begin
  insert into public.webhook_deliveries (provider, event_key, event_type, payload_sha256)
  values ('kiwify', p_event_key, p_event_type, p_payload_sha256)
  on conflict (provider, event_key) do nothing;

  get diagnostics inserted_delivery = row_count;
  if not inserted_delivery then
    return false;
  end if;

  insert into public.kiwify_orders (
    purchase_id, buyer_email, product_id, status, amount_cents, currency, provider_occurred_at
  ) values (
    p_purchase_id, lower(p_buyer_email), p_product_id, p_status, p_amount_cents,
    coalesce(nullif(p_currency, ''), 'BRL'), p_occurred_at
  )
  on conflict (purchase_id) do update set
    buyer_email = excluded.buyer_email,
    product_id = excluded.product_id,
    status = excluded.status,
    amount_cents = excluded.amount_cents,
    currency = excluded.currency,
    provider_occurred_at = excluded.provider_occurred_at,
    updated_at = now()
  where excluded.provider_occurred_at >= public.kiwify_orders.provider_occurred_at
  returning user_id into linked_user_id;

  -- If a refund/chargeback arrives after the student claimed the purchase,
  -- revoke the matching entitlement immediately.
  if p_status = 'revoked' and linked_user_id is not null then
    update public.entitlements
       set status = 'revoked', updated_at = now()
     where provider = 'kiwify'
       and provider_reference = p_purchase_id;
  end if;

  return true;
end;
$$;

create or replace function public.claim_kiwify_access(
  p_user_id uuid,
  p_email text
)
returns text
language plpgsql
security invoker
set search_path = public
as $$
declare
  order_row public.kiwify_orders%rowtype;
  course_access_level_id uuid;
begin
  select id into course_access_level_id
    from public.access_levels
   where slug = 'course-complete'
   limit 1;

  if course_access_level_id is null then
    raise exception 'course-complete access level is missing';
  end if;

  select * into order_row
    from public.kiwify_orders
   where lower(buyer_email) = lower(p_email)
     and status = 'active'
     and (user_id is null or user_id = p_user_id)
   order by provider_occurred_at desc
   limit 1
   for update;

  if not found then
    return 'pending';
  end if;

  insert into public.entitlements (
    user_id, access_level_id, status, provider, provider_reference
  ) values (
    p_user_id, course_access_level_id, 'active', 'kiwify', order_row.purchase_id
  )
  on conflict (provider_reference) do update set
    user_id = excluded.user_id,
    access_level_id = excluded.access_level_id,
    status = 'active',
    updated_at = now();

  update public.kiwify_orders
     set user_id = p_user_id, updated_at = now()
   where id = order_row.id;

  return 'granted';
end;
$$;

revoke all on function public.process_kiwify_event(
  text, text, text, text, text, text, text, integer, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.process_kiwify_event(
  text, text, text, text, text, text, text, integer, text, timestamptz
) to service_role;

revoke all on function public.claim_kiwify_access(uuid, text)
  from public, anon, authenticated;
grant execute on function public.claim_kiwify_access(uuid, text) to service_role;
