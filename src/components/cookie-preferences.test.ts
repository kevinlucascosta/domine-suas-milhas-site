import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const source = readFileSync("src/components/cookie-preferences.tsx", "utf8");
const learningSite = readFileSync("src/components/learning-site.tsx", "utf8");
const studyReader = readFileSync("src/components/study-document-reader.tsx", "utf8");

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

test("expõe uma regra única para bloquear preferências opcionais recusadas", () => {
  assert.match(source, /export function canPersistPreferences\(\)/);
  assert.match(source, /return readChoice\(\)\?\.preferences === true;/);
});

test("não restaura nem envia a preferência de idioma sem consentimento", () => {
  assert.match(learningSite, /if \(!canPersistPreferences\(\)\) return "pt-BR";/);
  assert.match(learningSite, /useState<Lang \| null>\(null\)/);
  assert.match(learningSite, /setSessionLanguage\(code\);/);
  assert.match(
    learningSite,
    /if \(canPersistPreferences\(\) && authenticatedUser && studentProfile && hasSupabaseBrowserConfig\(\)\)/,
  );
  assert.match(studyReader, /if \(!canPersistPreferences\(\)\) return;/);
});

test("só persiste o progresso da aula depois de liberar o curso", () => {
  assert.match(
    learningSite,
    /if \(!lessonQuizLoaded \|\| courseAccessStatus !== "granted"\) return;/,
  );
});
