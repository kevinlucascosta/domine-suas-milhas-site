-- Executar somente no banco milhas-rotadas-testes. Todos os eventos são fictícios.
-- O rollback remove os registros do ensaio, sem apagar dados preexistentes.
begin;
set local role service_role;
do $$
declare
  test_purchase_id text := 'mr-isolated-smoke-' || gen_random_uuid()::text;
  event_prefix text := gen_random_uuid()::text;
  email text := 'payment-smoke@example.invalid';
  fingerprint text := repeat('0', 64);
begin
  if not exists (select 1 from public.access_levels where name = 'Curso completo — ambiente de testes') then
    raise exception 'O teste exige o catálogo do ambiente isolado';
  end if;
  if public.process_kiwify_event(event_prefix || ':paid', 'order_approved', fingerprint,
    test_purchase_id, email, 'mr-test-product', 'active', 5000, 'BRL', '2026-11-01T10:00:00Z') is distinct from true then
    raise exception 'Aprovação nova não processada';
  end if;
  if (select status from public.kiwify_orders where kiwify_orders.purchase_id = test_purchase_id) is distinct from 'active' then
    raise exception 'Aprovação não ativou o pedido fictício';
  end if;
  if public.process_kiwify_event(event_prefix || ':paid', 'order_approved', fingerprint,
    test_purchase_id, email, 'mr-test-product', 'active', 5000, 'BRL', '2026-11-01T10:00:00Z') is distinct from false then
    raise exception 'Duplicata não foi reconhecida';
  end if;
  if public.process_kiwify_event(event_prefix || ':refund', 'order_refunded', fingerprint,
    test_purchase_id, email, 'mr-test-product', 'revoked', 5000, 'BRL', '2026-11-02T10:00:00Z') is distinct from true then
    raise exception 'Reembolso fictício não processado';
  end if;
  if public.process_kiwify_event(event_prefix || ':old', 'order_approved', fingerprint,
    test_purchase_id, email, 'mr-test-product', 'active', 5000, 'BRL', '2026-11-01T11:00:00Z') is distinct from true then
    raise exception 'Evento antigo não foi registrado';
  end if;
  if (select status from public.kiwify_orders where kiwify_orders.purchase_id = test_purchase_id) is distinct from 'revoked' then
    raise exception 'Evento antigo reativou pedido reembolsado';
  end if;
  if (select count(*) from public.webhook_deliveries where event_key like event_prefix || ':%') <> 3 then
    raise exception 'Quantidade de entregas não respeita idempotência';
  end if;
  if public.claim_kiwify_access(gen_random_uuid(), 'no-order@example.invalid') is distinct from 'pending' then
    raise exception 'E-mail sem compra obteve concessão';
  end if;
end;
$$;
rollback;
