# Ambiente isolado para ensaios de pagamento

Data do relatório: 08/11/2026 (America/Sao_Paulo).
Branch: `security/audit-remediation`; base desta etapa: `724475e`.

## Escopo e recursos

Autorizado criar `milhas-rotadas-testes` na organização `kevinlucascosta` somente com custo confirmado zero, usando dados fictícios e sem alterar banco/webhook de produção. A consulta `get_cost(type=project)` retornou amount=0, recurrence=monthly antes da criação. Organização aparece como FREE no painel. Não houve contratação ou upgrade; os limites do plano gratuito continuam aplicáveis.

- Projeto novo: `eejtatjyuivvvdgavoec`, região `sa-east-1`, estado `ACTIVE_HEALTHY`.
- Receptor novo: `https://eejtatjyuivvvdgavoec.supabase.co/functions/v1/kiwify-test-receiver`.
- Função publicada: versão 1, ACTIVE. Isto é uma publicação exclusivamente de infraestrutura de teste, não do site/branch de produção.
- Nenhum arquivo de frontend, configuração Next/ESLint, dependência ou lockfile alterado nesta etapa.
- Vercel não recebeu projeto, variável nem deployment. O plano encontrado é Hobby; não se presumiu adequação para uso comercial da cliente.

## Banco criado e ensaios executados

Confirmado schema public vazio antes da preparação. Aplicada migration única `isolated_payment_foundation`, em transação, com esta sequência:

1. `supabase/tests/fixtures/payment-bootstrap.sql` — somente estrutura básica Auth/access_levels/entitlements e catálogo fictício.
2. `supabase/migrations/20261001200141_course_access_from_kiwify.sql` — DDL existente, sem cópia de pedidos.
3. `supabase/migrations/20261009031500_grant_manual_course_access.sql` — DDL existente, sem concessões de clientes.
4. `supabase/tests/fixtures/payment-service-grants.sql` — tabelas de pagamento inacessíveis aos papéis de alunos.

NÃO reaplicar esse bootstrap em produção. NÃO copiar migrations posteriores com dados pessoais. Ele falha se já houver tabelas no schema public.

Cinco tabelas public com RLS habilitada; anon sem SELECT. authenticated com SELECT apenas no catálogo e nas próprias concessões, conforme policy. Metadados confirmam RPCs process_kiwify_event/claim_kiwify_access executáveis por service_role, não por anon/authenticated. São funções invoker, não SECURITY DEFINER.

`supabase/tests/payment-smoke.sql` executado no projeto novo, com role serviço e rollback. Asserções validam aprovação, duplicata, reembolso, evento antigo que não reativa pedido, três entregas únicas e claim sem compra retornando pending. Nenhuma conta foi criada: este ensaio não comprova concessão com usuário Auth, login ou sessão.

Após SQL e sondas HTTP: auth.users=0, entitlements=0, kiwify_orders=0, webhook_deliveries=0. Existe apenas um item de catálogo de teste.

Advisor de segurança: três avisos INFO `rls_enabled_no_policy` nas tabelas kiwify_orders/manual_course_grants/webhook_deliveries. Ausência de policies é intencional para negar acesso de alunos; o serviço usa privilégios próprios. Não criar policy pública para remover esse aviso. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy

## Receptor e limites de equivalência

`supabase/functions/kiwify-test-receiver/handler.mjs` é a transpilação do handler atual `src/app/api/webhooks/kiwify/route.ts`: TypeScript transpileModule ES2022/ESNext, NextResponse e import do cliente substituídos pelo adapter local. Adicionado import explícito de Buffer de node:buffer para não depender de global Node no Deno. Não é código gerado automaticamente pelo build: qualquer mudança futura no handler original exige regeneração e nova revisão de equivalência.

`runtime.mjs` só aceita o hostname do projeto de testes. Usa credencial automática do ambiente Edge sem exportá-la. `index.mjs` exige POST e segredo novo `KIWIFY_TEST_WEBHOOK_SECRET`; sem esse segredo retorna 503. `verify_jwt=false` vale apenas para esta função externa com autenticação própria. Não altera autenticação das demais funções ou do site.

Produto padrão fictício `mr-test-product`, 5000 centavos, BRL. Não corresponde automaticamente ao payload do botão de teste da Kiwify. Segredo de produção nunca deve ser reutilizado. A configuração do segredo novo deve ser feita pelo usuário diretamente no painel, não no chat.

Sondas hospedadas realizadas sem chave, sem payload pessoal:

- GET: 405, method_not_allowed, Allow: POST.
- POST com `{}` e nenhum segredo configurado: 503, test_secret_not_configured.

Isso comprova carregamento e fechamento no Edge. NÃO comprova processamento autenticado hospedado nem o runtime Next/Vercel. O webhook da Kiwify atual não foi cadastrado, editado nem disparado contra este destino.

## Testes e revisão independente

- `node --experimental-vm-modules --test supabase/tests/kiwify-edge.test.mjs`: 6/6 aprovados. Executa os módulos reais sem Buffer global; simula somente o SDK na fronteira de rede. Cobre projeto divergente, segredo ausente/incorreto, método, aprovação/normalização, divergência de produto/valor/moeda, reembolso, erro RPC e duplicata. O Node emite aviso esperado de VM Modules experimental.
- Antes do import Buffer: cinco testes falharam; depois do ajuste: zero falhas.
- `node --import tsx --test "src/**/*.test.ts"`: 57/57 aprovados. Parte desta suíte é estrutural, não prova integração real.
- ESLint dos novos módulos/teste: zero erros/avisos.
- `tsc --noEmit --incremental false`: saída 0.
- `npm run build`: saída 0, 31 páginas geradas.
- ESLint geral: 13 erros/17 avisos. Comparação completa com baseline anterior: mesmos 30 diagnósticos, nenhuma mudança. JSON fora do repositório: `C:/Users/Asus/Downloads/skills/skills-main/prompt-skills-staging/lint-test-env.json`.
- Três subagentes revisaram esquema, receptor e guardrails, somente leitura. Encontraram ausência de Buffer e asserções SQL que aceitavam NULL; ambos corrigidos antes da conclusão. Revisões estáticas não substituem execução integrada.

## Checklist — concluído

- [x] Custo zero consultado antes de criar projeto separado.
- [x] Estrutura mínima e RLS configuradas somente no banco novo.
- [x] Aprovação/duplicata/reembolso/evento antigo testados com SQL fictício e rollback.
- [x] Receptor novo implantado fechado; GET405/POST503 conferidos pela rede.
- [x] Testes locais, build e typecheck concluídos; lint sem novos diagnósticos.
- [x] Revisão independente de três subagentes e correção dos achados.
- [x] Produção e webhook atual preservados.

## Checklist — pendente / não comprovado

- [ ] Usuário cadastrar segredo exclusivo em https://supabase.com/dashboard/project/eejtatjyuivvvdgavoec/functions/secrets (aba preparada, nome preenchido, valor vazio e não salvo).
- [ ] Teste HTTP autenticado contra banco novo, observando resultado persistido, duplicata e revogação. Não confundir mock local com integração hospedada.
- [ ] Conferir suporte/payload de ensaio da Kiwify sem conectar produto real ao banco de testes ou transmitir dados de clientes.
- [ ] Criar contas fictícias pela Auth, testar login, vínculo da compra e acesso/negação real aos materiais em ambiente de aplicação isolado. Nenhum usuário fictício existe ainda.
- [ ] Validar o handler no runtime Next/Vercel separado quando houver meio adequado; Edge adapter não é substituto integral.
- [ ] Login real, envio de e-mail, compra/reembolso real, concorrência e rollback de publicação de produção não foram testados nesta etapa.
- [ ] Lint antigo permanece pendente; fora do escopo desta preparação.

Não houve falha restante nos ensaios executados após os ajustes, mas isso não significa fluxo real completo aprovado. Não houve push, merge ou publicação do site principal. Reverter o commit local não remove recursos externos; eventual desativação/remoção do projeto de testes requer ação separada, não executada.
