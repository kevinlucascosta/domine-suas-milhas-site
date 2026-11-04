# Availability Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce abuse against public API routes without changing the site's interface, navigation, animations, payments, or course access.

**Architecture:** Use Vercel Firewall rate-limit rules at the edge so abusive requests are stopped before reaching Next.js or the database. Start each rule in observation mode, review matching traffic, then promote only validated rules to enforcement.

**Tech Stack:** Vercel Firewall, Next.js 16, Supabase Auth, Kiwify webhooks.

**Spec:** User request of 2026-11-03 for non-visual security corrections only.

## Global Constraints

- Do not modify visual design, text, components, animations, routes, checkout, or authentication user flows.
- Do not deploy, merge to `main`, or publish Firewall drafts without explicit approval after review.
- Do not add an in-memory application rate limiter because it is not reliable across serverless instances.
- Keep `/api/health` behavior unchanged; protect it at the edge.

## Review Focus

- Kiwify webhook delivery must not be rejected during normal retries.
- Login/access recovery flow must remain available to legitimate users.
- Health monitoring must keep returning its current response.
- Firewall changes must remain drafts until traffic review confirms their scope.
- No source file outside this plan/documentation should change unless a test proves a code change is necessary.

---

### Task 1: Stage observation-only API protection rules

**Files:**
- Create: `SECURITY_ROLLOUT.md`

**Interfaces:**
- Consumes: Vercel project `lary-milhas-rotadas` and its Firewall CLI.
- Produces: Three unpublished Vercel Firewall draft rules and a documented rollout/rollback procedure.

- [ ] **Step 1: Verify the Firewall starts with no custom rules**

Run: `npx vercel firewall rules list --project lary-milhas-rotadas --json`
Expected: no custom rules and no drafts.

- [ ] **Step 2: Stage observation-only limits**

Create separate per-IP rules for `GET /api/health`, `POST /api/access/claim`, and `POST /api/webhooks/kiwify`. Each starts with `rate-limit-action log` and is not published.

- [ ] **Step 3: Review the generated Firewall diff**

Run: `npx vercel firewall diff --project lary-milhas-rotadas --json`
Expected: exactly the three observation rules, no published production change.

- [ ] **Step 4: Record rollout and rollback**

Document the exact rules, how to inspect traffic, how to promote them after review, and how to discard drafts.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-11-03-availability-hardening.md SECURITY_ROLLOUT.md
git commit -m "docs: registra reforco de disponibilidade"
```

### Task 2: Defer integration-dependent protections

**Files:**
- Modify: `SECURITY_ROLLOUT.md`

**Interfaces:**
- Consumes: Kiwify account webhook signature details and Supabase subscription settings.
- Produces: Explicit prerequisites, without changing live payments or authentication.

- [ ] **Step 1: Document prerequisites**

Record that Kiwify asymmetric signature verification requires the provider's incoming-event signature format and a test webhook, and that leaked-password protection requires Supabase Pro or higher.

- [ ] **Step 2: Commit with Task 1**

No application code is changed because guessing either integration could interrupt legitimate payments or sign-in.
