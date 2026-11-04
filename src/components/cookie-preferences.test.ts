import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/cookie-preferences.tsx", "utf8");

test("mantém a primeira renderização igual antes de ler cookies salvos", () => {
  assert.match(source, /useSyncExternalStore/);
  assert.match(source, /function serverChoice\(\)\s*\{\s*return undefined;/);
  assert.match(source, /choice === undefined/);
  assert.doesNotMatch(source, /useState<Choice \| null>\(\(\) => readChoice\(\)\)/);
});

test("mantém uma referência estável da preferência lida", () => {
  assert.match(source, /let cachedStoredChoice/);
  assert.match(source, /if \(storedChoice === cachedStoredChoice\) return cachedChoice;/);
});
