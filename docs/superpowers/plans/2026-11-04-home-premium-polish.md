# Home Premium Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar a primeira impressão da Home sem mudar conteúdo, estrutura ou rotas.

**Architecture:** Os ajustes ficam nos estilos já vinculados à Home e aproveitam os seletores `home-flow`, `home-reveal` e `hero-entrance`. Um teste estático protege o escopo da Home, a visibilidade inicial e a proteção de movimento reduzido.

**Tech Stack:** Next.js, React, TypeScript e CSS.

**Spec:** `docs/superpowers/specs/2026-11-04-home-premium-polish-design.md`

## Global Constraints

- Não alterar textos, JSX estrutural, rotas, integrações, imagens, fontes ou páginas internas.
- Sem novas dependências ou alteração de configurações.
- Apenas `opacity` e `transform` nas animações adicionadas ou ajustadas.
- Main e domínio público permanecem intocados até aprovação posterior.

## Review Focus

- Em 390 px, conteúdo inicial não pode ultrapassar a largura do viewport.
- Com movimento reduzido, cards e CTA devem ficar imediatamente visíveis.
- A Home continua a ser a única rota a receber o acento âmbar e o refinamento de motion.
- O CTA mantém contraste e foco visível para teclado.
- Build de produção continua a gerar todas as rotas.

---

### Task 1: Visibilidade e movimento da Home

**Files:**
- Create: `src/components/home-premium-polish.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consomes: classes já existentes `hero-entrance`, `home-flow`, `home-reveal` e `motion-stagger-card`.
- Produces: motion da Home com entrada curta e fallback de movimento reduzido.

- [ ] **Step 1: Write the failing test**

O teste exige que o maior atraso da Hero seja no máximo `240ms`, que o fallback de movimento reduzido atinja cards, selo e CTA, e que os seletores permaneçam restritos à Home.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/components/home-premium-polish.test.ts`
Expected: FAIL porque a regra de movimento reduzido ainda não cobre todos os elementos decorativos da Home.

- [ ] **Step 3: Implement the minimal CSS adjustment**

Em `src/app/globals.css`, reduzir somente os atrasos da Hero e completar o bloco `prefers-reduced-motion` para as classes de motion da Home. Não alterar o timing de outras rotas.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/components/home-premium-polish.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/globals.css src/components/home-premium-polish.test.ts
git commit -m "fix: suaviza entrada da Home"
```

### Task 2: Validação de experiência

**Files:**
- Modify: nenhum arquivo de produto obrigatório.

**Interfaces:**
- Consomes: Home renderizada na build de produção.
- Produces: evidência visual desktop e 390 px, sem transbordamento horizontal.

- [ ] **Step 1: Run verification**

Executar teste específico, `npx tsc --noEmit --incremental false`, `npm run build` e inspeção da Home em 390 px e desktop.

- [ ] **Step 2: Commit the plan documentation**

```bash
git add docs/superpowers/specs/2026-11-04-home-premium-polish-design.md docs/superpowers/plans/2026-11-04-home-premium-polish.md
git commit -m "docs: registra acabamento da Home"
```
