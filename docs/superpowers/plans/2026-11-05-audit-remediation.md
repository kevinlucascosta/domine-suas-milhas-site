# Audit Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Impedir acesso anônimo aos materiais premium da Aula 01 sem alterar a interface, e registrar por teste que XP não decide acesso premium.

**Architecture:** Os PDFs sairão de `public/` e serão servidos por um Route Handler Node protegido por claims e entitlement ativo, com caminhos estáticos por documento. A página de material passará a exigir a mesma proteção de rota do curso. XP permanecerá gamificação não autorizativa; o teste protege essa decisão sem mudar o fluxo atual.

**Tech Stack:** Next.js App Router, React, TypeScript, Supabase SSR, Node test runner.

**Spec:** Autorização direta do usuário em 05/11/2026: corrigir os itens da auditoria sem alterar design ou fluxos prontos, com backup, branch, checklist e revisão por agentes.

## Global Constraints

- Não alterar design, textos, animações, checkout, login ou dados reais.
- Não acessar produção, contas reais, Supabase/Kiwify/Vercel, nem publicar nesta etapa.
- Não modificar configuração, dependências ou variáveis de ambiente.
- Aplicar apenas a menor correção de fonte que proteja materiais premium.
- Executar testes antes e depois de cada mudança e revisão independente final.

## Review Focus

- Visitante anônimo nunca recebe PDF premium, mesmo conhecendo a URL antiga.
- Aluno autenticado com entitlement ativo continua abrindo o mesmo PDF em nova aba.
- Aluno autenticado sem entitlement recebe negativa, sem conteúdo parcial.
- Rotas existentes de curso, login, recuperação e checkout mantêm os destinos atuais.
- XP/missões continuam sem interferir na decisão de acesso premium.

---

### Task 1: Entrega protegida dos materiais da Aula 01

**Files:**
- Create: `src/app/api/material/[document]/route.ts`
- Create: `src/app/api/material/route.test.ts`
- Modify: `src/lib/supabase/proxy.ts`
- Modify: `src/components/study-document-reader.tsx`
- Move: `public/lesson-01/*.pdf` to `private/lesson-01/`

**Interfaces:**
- Consumes: cookies Supabase verificadas por `getClaims()` e tabela `entitlements`.
- Produces: `GET /api/material/:document`, que retorna PDF somente a aluno com entitlement ativo.

- [ ] **Step 1: Escrever os testes que falham**

Cobrir que o handler contém allowlist estática de documentos, exige claims/entitlement e que o leitor aponta para `/api/material/`; cobrir que `/material` passa a pertencer à lista premium.

- [ ] **Step 2: Rodar os testes e confirmar falha**

Run: `node --test src/app/api/material/route.test.ts`
Expected: FAIL porque o handler e a proteção ainda não existem.

- [ ] **Step 3: Implementar a menor entrega protegida**

Criar handler Node que valida documento por allowlist, identifica o aluno por claims, confere entitlement ativo e lê apenas o arquivo mapeado. Adicionar `/material` à lista premium, trocar somente o href dos PDFs e mover os dois arquivos para fora de `public`.

- [ ] **Step 4: Rodar os testes e confirmar sucesso**

Run: `node --test src/app/api/material/route.test.ts`
Expected: PASS.

- [ ] **Step 5: Verificar build e commit**

Run: `npm run typecheck && npm run build`
Expected: exit 0. Commit: `fix: protege materiais premium da aula`.

### Task 2: Guardar a separação entre XP e acesso premium

**Files:**
- Create: `src/lib/course-access-security.test.ts`

**Interfaces:**
- Consumes: `src/lib/course-access.ts` e migrations de XP.
- Produces: teste de regressão documentando que entitlement, e não XP/missões, decide acesso premium.

- [ ] **Step 1: Escrever o teste de regressão**

O teste deve falhar se `course-access.ts` vier a usar tabelas ou campos de XP/missões para conceder acesso.

- [ ] **Step 2: Rodar o teste e confirmar o estado atual**

Run: `node --test src/lib/course-access-security.test.ts`
Expected: PASS, pois o comportamento atual já mantém acesso independente de XP.

- [ ] **Step 3: Registrar a decisão sem alterar a gamificação**

Não há alteração de produção: o risco só se torna autorização se XP passar a liberar algo. O teste é a proteção mínima, evitando uma mudança comportamental insegura.

- [ ] **Step 4: Rodar o conjunto relevante e commit**

Run: `node --test src/app/api/material/route.test.ts src/lib/course-access-security.test.ts`
Expected: PASS. Commit: `test: protege acesso premium de dependência em XP`.

### Task 3: Verificação e revisão independente

**Files:**
- No production files beyond Tasks 1-2.

- [ ] **Step 1: Rodar lint, typecheck, build e testes relevantes**
- [ ] **Step 2: Revisar diff e status antes de qualquer commit final**
- [ ] **Step 3: Solicitar revisão independente por agentes contra este plano e a auditoria**
- [ ] **Step 4: Produzir checklist de verificado, pendente e não alterado**
