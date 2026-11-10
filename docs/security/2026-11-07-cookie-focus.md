# Correção isolada do foco no painel de cookies

Branch de trabalho: `security/audit-remediation`. Base: `6563de4`.
Sem publicação, alteração de banco, dependências, estilos ou regras de consentimento.

## Problema e causa

O painel declarava `role="dialog"` e `aria-modal="true"`, mas não movia nem continha o foco. Na reprodução local antes da edição, abrir pelo rodapé deixou o foco em “Preferências de cookies”, fora do painel; Tab podia avançar para links da página.

## Alteração

Somente `src/components/cookie-preferences.tsx`: referência ao painel e efeito ativo apenas enquanto estiver visível. Ao abrir, focaliza o primeiro controle habilitado. Tab e Shift+Tab fecham o ciclo interno; o listener de foco impede escapadas programáticas. Ao fechar/desmontar, remove os listeners e restaura o elemento anterior quando ele ainda existe. As chamadas de foco usam `preventScroll`.

Textos, classes, cores, estrutura de elementos, funções públicas e gravação das preferências não foram alterados. A section recebeu apenas `ref` e `tabIndex=-1`, para permitir foco de segurança se não houver controles disponíveis. O foco visível dos controles continua sendo o definido pelos estilos existentes.

## Teste de regressão no navegador real

Roteiro executado pela automação do navegador integrado contra a cópia local em `127.0.0.1:3210`, não contra produção. Não requer nova dependência de teste.

1. Antes de editar, abrir a Home e o painel pelo botão do rodapé. Consultar se o diálogo contém `document.activeElement`: **false**. Essa é a falha inicial reproduzida.
2. Depois de editar, repetir: foco em `cookie-preferences-toggle`, dentro do painel.
3. No primeiro controle, pressionar Shift+Tab: foco em “Salvar escolhas”.
4. No último botão, pressionar Tab: foco retorna ao checkbox.
5. Com largura 390×844, executar sete passos de Tab: checkbox → Apenas necessários → Salvar escolhas → checkbox, sem sair do painel.
6. Marcar a preferência opcional, salvar e reabrir: checkbox continua marcado. Concluir com “Apenas necessários” na aba de teste.
7. Reabrir pelo rodapé e fechar: foco volta ao botão “Preferências de cookies”.
8. Em `/cadastro?mode=login`, largura 1440×900, repetir abertura, Shift+Tab, Tab e fechamento: mesmos resultados. Nenhuma credencial foi preenchida nem login enviado.
9. Console da aba local após o roteiro: nenhum erro ou aviso capturado. A viewport temporária foi restaurada e o servidor dev encerrado.

Na abertura automática da primeira visita não há botão de origem: o elemento anterior pode ser o body. Não se afirma retorno ao rodapé nesse caso. Nenhuma escolha foi criada implicitamente ao abrir ou navegar com Tab.

Este roteiro é uma verificação de comportamento executada no navegador; não foi adicionado a um runner de CI. A suíte automatizada existente é parcialmente estrutural e não substitui este teste de foco.

## Checklist — concluído

- [x] Falha reproduzida antes da edição na cópia local.
- [x] Foco inicial, ciclo de teclado e restauração confirmados depois da edição.
- [x] Verificação em largura móvel e desktop, na Home e na página de login.
- [x] Escolha opcional preservada ao salvar e reabrir.
- [x] Revisão estática independente por subagente: nenhum achado concreto no escopo aprovado; não substitui os testes do principal.
- [x] ESLint isolado do componente e TypeScript sem erros.
- [x] Suíte existente de `src/**/*.test.ts`: 57 aprovados, zero falhas.
- [x] `npm run build`: saída 0, 31 páginas geradas.
- [x] Comparação dos 30 diagnósticos completos de ESLint com a base (arquivo, linha, coluna, regra, severidade e mensagem): nenhuma diferença.
- [x] Nenhuma publicação, mudança de configuração ou operação sobre dados reais.

## Checklist — limites e pendências

- [ ] Lint geral ainda reprovado: 13 erros e 17 avisos já presentes na base; nenhum diagnóstico novo nesta correção.
- [ ] Não realizada comparação automatizada pixel a pixel; o diff não altera CSS nem textos.
- [ ] Não testado com leitor de tela, iPhone ou Android físicos.
- [ ] Escape, bloqueio de clique no fundo e tratamento de falha do localStorage não foram acrescentados: são itens distintos do ajuste de foco aprovado.
- [ ] Produção permanece sem esta correção até autorização e execução de publicação apropriada. O restante da branch contém trabalho de quiz com pré-requisitos de banco; este teste não libera sua publicação.

Reversão: reverter somente o commit desta correção, sem descartar os outros trabalhos da branch.
