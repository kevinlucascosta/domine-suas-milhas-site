import test from "node:test";
import assert from "node:assert/strict";

import { legalPages, legalPlaceholders } from "./legal-content";

test("publishes every required legal document with a clearly scoped pending retention field", () => {
  assert.deepEqual(
    legalPages.map((page) => page.slug),
    ["privacidade", "cookies", "termos", "reembolso", "direitos"],
  );
  assert.ok(legalPlaceholders.includes("[PREENCHER: prazo de retenção por categoria de dado]"));
});

test("documents the collection, cookies and refund flow without inventing business data", () => {
  const privacy = legalPages.find((page) => page.slug === "privacidade");
  const cookies = legalPages.find((page) => page.slug === "cookies");
  const refund = legalPages.find((page) => page.slug === "reembolso");

  assert.ok(privacy?.sections.some((section) => section.heading === "Dados que tratamos"));
  assert.ok(cookies?.sections.some((section) => section.heading === "Suas escolhas"));
  assert.ok(refund?.sections.some((section) => section.heading === "Garantia e reembolso"));
});

test("identifies the public support and privacy contacts without exposing CPF or address", () => {
  const allText = legalPages.flatMap((page) => page.sections.flatMap((section) => section.paragraphs)).join(" ");
  assert.match(allText, /Laryany/);
  assert.match(allText, /suporte\.dominesuasmilhas@gmail\.com/);
  assert.match(allText, /milhasrotadas@outlook\.pt/);
  assert.doesNotMatch(allText, /\[PREENCHER: CPF|\[PREENCHER: endereço/);
});
