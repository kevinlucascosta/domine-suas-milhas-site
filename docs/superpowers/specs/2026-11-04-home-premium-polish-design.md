# Home Premium Polish — Design

## Intenção

Fazer a primeira visita à Home de Milhas Rotadas parecer segura, organizada e profissional para quem considera comprar as aulas. A página deve comunicar aprendizado prático sobre milhas, evidenciar progresso e conduzir naturalmente ao checkout, sem alterar conteúdo, rotas ou a identidade visual existente.

## Escopo

- Apenas a rota inicial e seus estilos já exclusivos.
- Manter textos, fontes, estrutura, imagens, CTAs, navegação, checkout e páginas internas.
- Reaproveitar os acentos âmbar já validados para XP, trilha e CTAs da Home.

## Direção visual

Base: carvão `#303030`, azul acinzentado `#708090`, cinza de linha `#C8CDD2`, azul suave `#DDE9F3`, branco `#FFFFFF`.

Acento: âmbar `#D4A64A`, usado apenas para indicar avanço, conquista e ação principal. A marca continua leve e editorial; o âmbar não vira uma nova cor de fundo da página.

## Decisões de experiência

1. A primeira dobra deve revelar selo, título, explicação e ação em sequência curta, sem deixar áreas importantes invisíveis em conexões ou aparelhos mais lentos.
2. A trilha "De iniciante a estrategista" continua sendo uma sequência de quatro etapas. Seus cards ganham contraste de progresso e resposta tátil, mas não mudam de texto ou estrutura.
3. O movimento permanece discreto: apenas `opacity` e `transform`, com movimento reduzido respeitado e sem loops quando essa preferência estiver ativa.
4. A seção de conversão mantém o mesmo CTA e ganha a mesma linguagem de confiança do progresso, sem mudanças comerciais.

## Não objetivos

- Não alterar cabeçalho, atalhos sociais flutuantes, barra inferior, páginas internas, integrações, dados de XP ou conteúdo editorial.
- Não instalar dependências, criar carrosséis, adicionar contadores ou mudar layout de desktop.

## Validação

- Home renderiza sem rolagem horizontal em 390 px e permanece coerente em desktop.
- A aparência inicial não deixa título ou CTA ocultos por mais de 300 ms.
- `prefers-reduced-motion` deixa conteúdo visível e desativa flutuações e revelações decorativas.
- TypeScript, build de produção e teste específico passam.
