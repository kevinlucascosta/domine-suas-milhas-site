import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const siteStyles = readFileSync(resolve(process.cwd(), "src/app/site.css"), "utf8");
const globalStyles = readFileSync(
  resolve(process.cwd(), "src/app/globals.css"),
  "utf8",
);

test("mantém o carrossel de resultados com altura estável no celular", () => {
  assert.match(
    siteStyles,
    /@media\s*\(max-width:\s*700px\)[\s\S]*?\.traveler-testimonial-image \{[^}]*aspect-ratio:/,
  );
  assert.match(siteStyles, /\.traveler-testimonial-stage \{[^}]*overflow-anchor: none/);
});

test("usa detalhes dourados discretos nos cards escuros de progresso", () => {
  assert.match(
    globalStyles,
    /\.course-progress-card::after \{[^}]*border-color: rgba\(212, 166, 74/,
  );
  assert.match(
    globalStyles,
    /\.missions-top::after \{[^}]*border-color: rgba\(212, 166, 74/,
  );
  assert.match(
    globalStyles,
    /\.course-progress-number strong \{ color: var\(--amber\); \}/,
  );
});

test("oculta o indicador de rolagem sem desativar a rolagem do documento", () => {
  assert.match(globalStyles, /-ms-overflow-style: none/);
  assert.doesNotMatch(globalStyles, /overflow-y:\s*hidden/);
});
