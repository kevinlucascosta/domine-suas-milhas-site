# Home Hero, Compliance and Accessibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy/accessibility foundations across the existing course site and a premium scroll-linked Hero only on the public home page.

**Architecture:** Preserve the Next.js catch-all application and its design tokens. Add narrow consent/legal/motion helpers. Use CSS scroll-driven animation as progressive enhancement, with an immediately visible fallback.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, existing CSS and Supabase Auth; no new dependency without a separate approval.

**Spec:** `C:\Users\Asus\Downloads\skills\skills-main\Prompt_5_Arquitetura_Hero_Premium_v3_Scroll_Progressivo.md`; `C:\Users\Asus\Desktop\Sky Tech\Prompt_1_Conformidade_Total_v2.md`; `C:\Users\Asus\Desktop\Sky Tech\Prompt_3_Websites_10_10_Vibe_Coders_v2.md`.

## Global Constraints

- Preserve approved colors, fonts, logo, copy, routes, learning behavior and internal-page layouts.
- Prompt 5 applies only to the home Hero and approved immediately connected content, never to course, lesson, quiz, missions, profile, tools or auth screens.
- Do not add Motion, GSAP, shadcn/ui, 21st.dev, Phosphor, WebGL or 10x.app without specific approval.
- Legal documents use `[PREENCHER: ...]` markers for controller, CNPJ/CPF, address, DPO, retention, vendors and legal facts not supplied by the owner.
- Tag legal changes with `// [CONFORMIDADE]` and home Hero changes with `// AJUSTE: Hero`.
- Non-essential third-party scripts/embeds require consent; external links are not scripts.
- Scroll reveal must not hijack, slow, block or replace native scrolling; no-support fallback and reduced-motion state are immediately legible.
- TDD for all TypeScript behavior: write a failing test, observe RED, implement minimally, observe GREEN, then run the full suite.

## Review Focus

- Rejection of non-essential cookies persists and the preference dialog can reopen.
- Browsers without scroll-driven animation support render Hero content visibly.
- Reduced motion removes movement without removing information or CTA access.
- Legal pages retain unfilled factual markers instead of inventing business data.
- Internal routes never receive home-Hero motion initialization.

---

### Task 1: Baseline compliance and home audit

**Files:**
- Create: `docs/audits/2026-10-26-compliance-and-home-baseline.md`
- Inspect: `src/components/learning-site.tsx`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/site.css`, `src/app/api/**`, `public/**`, `package.json`

- [ ] Record third-party requests, cookies/storage, forms, external links, assets and commercial claims without changing code.
- [ ] Record home Hero semantics, LCP candidate, layout-shift sources, keyboard path and mobile/desktop observations.
- [ ] Create an evidence-based P0/P1/P2 audit and flag owner-dependent legal facts.

### Task 2: Structured legal copy and public routes

**Files:**
- Create: `src/lib/legal-copy.ts`
- Create: `src/lib/legal-copy.test.ts`
- Modify: `src/components/learning-site.tsx`, `src/lib/site-routes.ts`

**Interfaces:** `getLegalDocument(kind: "privacy" | "cookies" | "terms" | "accessibility", language: Lang): LegalDocument`; `LEGAL_FACT_MARKERS: readonly string[]`.

- [ ] Write a failing test that requires each legal document title and preservation of `[PREENCHER: ...]` markers.
- [ ] Run it and confirm RED because the module is absent.
- [ ] Implement plain-language structured copy with placeholders, no invented facts, and translated UI labels only.
- [ ] Run the test and confirm GREEN.
- [ ] Add public views/routes for Privacidade, Cookies, Termos and Acessibilidade with existing visual styles and `// [CONFORMIDADE]` comments.
- [ ] Test direct navigation, headings and keyboard order.

### Task 3: Consent model and guarded third parties

**Files:**
- Create: `src/lib/consent.ts`, `src/lib/consent.test.ts`, `src/components/cookie-consent.tsx`
- Modify: `src/components/learning-site.tsx`, `src/app/globals.css`

**Interfaces:** `ConsentPreferences`; `normalizeConsent(value: unknown): ConsentPreferences`; `canLoadCategory(preferences, category): boolean`.

- [ ] Write failing tests: non-essential categories default to false; rejection persists; only necessary resources are permitted before consent.
- [ ] Run RED.
- [ ] Implement safe storage access, policy-version metadata and pure consent state helpers.
- [ ] Run GREEN.
- [ ] Implement accessible preference dialog with equal Accept/Reject prominence, per-category controls, keyboard focus and reopen callback.
- [ ] Guard only audited non-essential scripts/embeds, then test accept/reject/customize/revoke/reload in a clean profile.

### Task 4: Footer, collection notices and targeted accessibility

**Files:**
- Modify: `src/components/learning-site.tsx`, `src/app/globals.css`, audit-identified form/auth components
- Test: focused legal/footer behavior test

- [ ] Write a failing test requiring Privacidade, Cookies, Termos and Preferências de cookies in the shared footer model.
- [ ] Run RED, implement footer links and genuine data-collection notices, then run GREEN.
- [ ] Fix only audited WCAG defects: alt text, labels, focus, contrast, touch targets and reduced motion.
- [ ] Test keyboard navigation and mobile touch targets.

### Task 5: Home-only Hero configuration

**Files:**
- Create: `src/lib/home-hero-motion.ts`, `src/lib/home-hero-motion.test.ts`
- Modify: `src/components/learning-site.tsx`, `src/app/globals.css`

**Interfaces:** `isHomeHeroRoute(route: string): boolean`; `HOME_HERO_MOTION` with named durations, distances, ranges, mobile and reduced-motion values.

- [ ] Write failing tests that only `/` is eligible and all motion values are deterministic positive values.
- [ ] Run RED, implement minimal route guard/configuration, then run GREEN.
- [ ] Refine only existing home Hero DOM into documented background/depth/content/ornament layers; preserve copy, CTA destinations and branding.
- [ ] Add LCP priority/dimensions only after Task 1 proves the asset and confirms no visual change.

### Task 6: Hero motion and real progressive scroll reveal

**Files:**
- Modify: `src/app/globals.css`, `src/components/learning-site.tsx`, `src/lib/home-hero-motion.ts`
- Test: `src/lib/home-hero-motion.test.ts`

**Contract:** `hero-scroll-reveal`, `hero-scroll-reveal--title`, `hero-scroll-reveal--copy`, `hero-scroll-reveal--cta`; visible no-support fallback; static reduced-motion fallback.

- [ ] Write failing tests for the class/config contract: no scroll-jacking flag, visible fallback, long progressive animation range and reduced-motion static state.
- [ ] Run RED.
- [ ] Implement CSS-first hover/focus/active, entrance reveal, light CSS 3D depth, microinteraction and limited transform-only parallax.
- [ ] Implement `@supports (animation-timeline: view())` reveal with a long `animation-range`; outside `@supports`, content remains visible.
- [ ] Add IntersectionObserver one-time fallback only if needed; never update React state per scroll frame.
- [ ] Run GREEN; verify wheel, touch, trackpad and keyboard scroll are native, including mobile landscape/reduced motion.

### Task 7: Final performance, accessibility and compliance QA

**Files:**
- Create: `docs/audits/2026-10-26-compliance-and-home-final.md`
- Modify: only defects demonstrated by verification

- [ ] Run all unit tests, typecheck, lint and production build.
- [ ] Compare home LCP candidate, CLS, bundle size and external requests with Task 1.
- [ ] Test 360px, tablet, desktop, keyboard, focus and reduced motion.
- [ ] Publish final audit: cookie table, assets/claims unknowns, all `[PREENCHER]` fields, legal decisions pending and official sources.
- [ ] Publish only after technical checks pass; never claim total legal compliance without owner facts and legal review.

## Spec Coverage Review

- Prompt 1: Tasks 1–4 and 7.
- Prompt 3: no-new-dependency rule and stack decisions in Tasks 5–6; 10x.app excluded as unrelated to this web site.
- Prompt 5: Tasks 5–7, explicitly home-only, with real progressive scroll reveal.
- Legal representation, licenses, retention and business facts remain owner-supplied decisions and will be clearly marked rather than guessed.
