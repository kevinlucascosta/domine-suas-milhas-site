# Verificação do quiz e da transição — 7 de novembro de 2026

Branch: `security/audit-remediation`. Trabalho local, sem aplicação de migrations ou publicação durante esta etapa. Backup do código anteriormente confirmado em produção: tag `backup/pre-transicao-quiz-dad9fd8`.

## Resultado dos três pontos

1. **Migration dividida em etapas reais.** `20261107040000_validate_module_quiz_answer.sql` adiciona somente o RPC novo. O corte está em `supabase/rollout/module-01-quiz/contract.sql`, fora do lote automático. A recuperação está em `rollback-contract.sql`. O runbook exige publicar e validar o cliente antes de promover o corte a uma migration posterior.
2. **Concorrência, API e recuperação testadas localmente.** PostgreSQL nativo 17.6, conexões distintas e espera observada por `pg_blocking_pids`. API com SDK Supabase instalado no projeto e PostgREST 14.18 oficial, assinaturas JWT fictícias e roles reais do PostgreSQL. O roteiro final terminou com código 0.
3. **Lint concluído.** ESLint analisou 66 arquivos e terminou com código 1: 13 erros e 17 avisos preexistentes. Não houve timeout. O roteiro novo foi analisado também isoladamente e terminou com código 0, sem achados.

## Cenários comprovados

- Dados antigos atravessam adição, corte, recuperação e reaplicação sem mudar seus valores.
- XP e bloqueios criados depois do corte também permanecem após recuperar a versão anterior.
- RPC legado e novo funcionam durante a etapa aditiva.
- Corte rejeita novas conclusões pelo caminho antigo e proíbe INSERT direto de bloqueios.
- Recuperação restaura o contrato legado e mantém o RPC novo; INSERT em nome de outra conta continua negado pelo RLS.
- Duas finalizações concorrentes produzem uma linha e exatamente 150 XP.
- Uma resposta incorreta impede uma conclusão correta concorrente.
- Duas respostas incorretas concorrentes produzem um bloqueio.
- Rollback da primeira tentativa não deixa bloqueio fantasma para a segunda.
- Uma conta não bloqueia as tentativas de outra.
- API aceita a conta fictícia habilitada e rejeita conta sem acesso, anônimo, JWT inválido e JWT expirado.
- Respostas incorretas iniciam o bloqueio; repetição da conclusão não concede XP novo.
- Leitura de XP e bloqueios fica isolada por conta.

## Comandos e resultados

- `node scripts/test-quiz-rollout.cjs`, com os caminhos locais dos binários definidos nas variáveis `QUIZ_TEST_*`: código 0.
- `node --import tsx --test` sobre todos os arquivos `src/**/*.test.ts`: 57 testes, 57 aprovados, zero falhas.
- `npm run build`: código 0, incluindo verificação TypeScript e geração de 31 páginas.
- `node --max-old-space-size=2048 node_modules/eslint/bin/eslint.js . --format json`: código 1, 13 erros e 17 avisos, sem novos achados.
- `node --max-old-space-size=2048 node_modules/eslint/bin/eslint.js scripts/test-quiz-rollout.cjs`: código 0.

## Lint remanescente

`learning-site.tsx`: dez erros `react-hooks/set-state-in-effect`, dois erros `react-hooks/purity`, seis avisos `react-hooks/exhaustive-deps`, nove avisos `@next/next/no-img-element` e um aviso de navegação por `window.location`.

`study-document-reader.tsx`: um erro `react-hooks/set-state-in-effect`. `ui/coverflow-documents.tsx`: um aviso `@next/next/no-img-element`.

Não foram silenciadas regras nem alterados esses fluxos para reduzir a contagem. A execução antes inconclusiva está resolvida; o projeto não está declarado como livre de lint.

## Revisões independentes

Três subagentes revisaram separação SQL/recuperação, desenho dos testes concorrentes/API e conclusão do lint. As revisões apontaram o corte único, o teste anterior que extraía apenas parte do SQL e a falta de dados criados após corte na prova de recuperação. Esses pontos foram incorporados ao roteiro real. Nenhum defeito impeditivo novo foi encontrado na revisão dos SQLs finais.

## Limites exatos

O teste usa um subconjunto de tabelas Auth/acesso/perfil com dados fictícios; os tipos relevantes foram conferidos por consulta de metadados no Supabase hospedado, sem ler registros de alunos. Não é execução da cadeia completa histórica de migrations.

A integração comprovada é SDK → HTTP local → PostgREST → JWT/roles → RPC/RLS → PostgreSQL. Não comprova login no Google, entrega de e-mail, GoTrue, refresh, navegador, gateway hospedado ou fluxo de compra. Nenhum teste desta etapa criou contas reais ou alterou dados de produção.

Durante a etapa aditiva e após rollback do corte, o caminho legado de XP continua permissivo. O corte final requer atualização de abas antigas. A recuperação por SQL preserva dados, mas reabre temporariamente essa permissão legada.

Os servidores locais são encerrados ao final; os diretórios de diagnóstico contêm somente dados fictícios. PostgreSQL e PostgREST foram preparados fora das dependências do site e não foram instalados como serviços do Windows.
