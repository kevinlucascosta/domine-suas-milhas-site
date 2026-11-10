-- Aplicar somente no projeto de testes, depois das migrations Kiwify/manual.
-- As tabelas de pagamento não são APIs de leitura/escrita de alunos.
revoke all on public.kiwify_orders, public.webhook_deliveries, public.manual_course_grants
  from public, anon, authenticated;
grant select, insert, update on public.kiwify_orders, public.manual_course_grants to service_role;
grant select, insert on public.webhook_deliveries to service_role;
