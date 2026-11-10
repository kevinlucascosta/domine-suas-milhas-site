# Implantação do quiz em etapas

Objetivo: disponibilizar o RPC que valida respostas sem quebrar o cliente anterior durante a publicação. O escopo não inclui mudar aulas, layout, autenticação do Google ou regras de compra.

## Etapas reais

1. Aplicar as migrations pendentes até `20261107040000_validate_module_quiz_answer.sql`. Essa migration apenas adiciona `submit_module_01_quiz_answer` e suas permissões. A validação anterior de perfil continua em sua própria migration.
2. Publicar o cliente que usa o RPC novo. Conferir seleção sem XP, finalização com 150 XP uma vez, resposta incorreta e bloqueio, troca de conta e conta sem acesso. Manter o RPC legado e a política de INSERT durante essa transição.
3. Em uma publicação posterior, depois de validar o cliente novo e atualizar as abas antigas, promover `supabase/rollout/module-01-quiz/contract.sql` para uma migration própria e aplicar o corte. Não colocar esse corte no mesmo lote automático da etapa 1. O SQL inclui transação e exige que a função nova exista.

Durante a transição, o caminho antigo ainda permite concluir o quiz sem enviar a resposta ao servidor e registrar bloqueios pelo navegador. A proteção completa do novo fluxo só existe após o corte. Esperar um intervalo por si só não comprova que todas as abas antigas foram atualizadas.

## Recuperação

- Antes do corte, reverter o cliente pode manter a etapa aditiva no banco; não é necessário remover o RPC novo.
- Depois do corte, preferir uma versão do cliente que continue usando o RPC novo.
- `rollback-contract.sql` restaura o RPC legado e a política de INSERT, mantendo o RPC novo e todos os dados. É recuperação operacional excepcional: reabre os limites antigos de segurança até reaplicar o corte.
- Não remover a função nova enquanto existir cliente que dependa dela. Não há script automático que apague dados, conquistas ou bloqueios.
- O backup Git protege o código. Antes de produção, guardar também definição das funções, grants, policies e backup do banco conforme os recursos disponíveis.

## Evidência de teste

O roteiro isolado executa baseline → dados antigos → adição → cliente antigo/novo → corte → recuperação → reaplicação. Compara registros integrais de XP e bloqueios, incluindo IDs e datas. As fixtures são fictícias; as tabelas de Auth, acesso e perfil são um subconjunto explícito do modelo, não uma cópia completa da stack Supabase.

Os testes de concorrência precisam de PostgreSQL nativo com conexões distintas. PGlite é útil para lógica SQL sequencial, mas não comprova concorrência entre sessões.

O teste via SDK e PostgREST, quando executado, cobre HTTP, assinatura JWT, role, claims, RPC e RLS. Não equivale a testar login, envio de e-mail, refresh de sessão ou navegador contra o provedor hospedado.

## Executar o teste completo gratuitamente no Windows

Pré-requisitos externos ao projeto: PostgreSQL 17.6 portátil e PostgREST 14.18 oficial. O teste usa `pg` e `@supabase/supabase-js` que já estão nas dependências. Não instala serviço no Windows nem faz download automático.

Definir `QUIZ_TEST_PG_BIN` com a pasta que contém `initdb.exe`, `pg_ctl.exe`, `postgres.exe` e as DLLs; `QUIZ_TEST_POSTGREST` com o caminho de `postgrest.exe`; e, opcionalmente, `QUIZ_TEST_ARTIFACT_DIR` com uma pasta temporária externa. Executar `node scripts/test-quiz-rollout.cjs`.

O roteiro abre portas efêmeras somente em `127.0.0.1`, cria um banco com contas fictícias e encerra os processos ao final. Diretórios de diagnóstico contêm apenas dados de teste. É obrigatório usar os caminhos de teste; não há parâmetro de conexão a produção.

PostgREST usa pool 1 e canal LISTEN desativado no teste HTTP para evitar uma falha de inicialização concorrente do runtime/libpq no Windows. Isso não altera os testes de concorrência SQL: eles usam três conexões PostgreSQL nativas distintas e verificam o bloqueio por `pg_blocking_pids`.

Resultados verificados em 7 de novembro de 2026: segurança SQL, isolamento, cinco cenários concorrentes, snapshots integrais antes/depois do corte e rollback, SDK HTTP com conta habilitada, conta sem acesso, anônimo, assinatura inválida e idempotência. A lista de testes não declara a stack completa nem o ambiente hospedado validados.
