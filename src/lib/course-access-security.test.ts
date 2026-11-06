import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";

const accessPath = resolve(process.cwd(), "src/lib/course-access.ts");
const claimRoutePath = resolve(process.cwd(), "src/app/api/access/claim/route.ts");
const proxyPath = resolve(process.cwd(), "src/lib/supabase/proxy.ts");
const learningSitePath = resolve(process.cwd(), "src/components/learning-site.tsx");
const lessonQuestionsRoutePath = resolve(
  process.cwd(),
  "src/app/api/lesson-01/questions/route.ts",
);

test("o acesso ao curso depende de entitlement ativo, não de XP ou missões", () => {
  const access = readFileSync(accessPath, "utf8");
  const claimRoute = readFileSync(claimRoutePath, "utf8");
  const proxy = readFileSync(proxyPath, "utf8");

  assert.match(access, /from\("entitlements"\)/);
  assert.match(access, /claim_kiwify_access/);
  assert.match(claimRoute, /claimCourseAccessForUser/);
  assert.match(proxy, /from\("entitlements"\)/);
  assert.doesNotMatch(access, /xp_events|learning_mission|complete_learning_mission/);
  assert.doesNotMatch(claimRoute, /xp_events|learning_mission|complete_learning_mission/);
});

test("a Home pública não importa respostas ou explicações premium", () => {
  const learningSite = readFileSync(learningSitePath, "utf8");
  const lessonQuestionsRoute = readFileSync(lessonQuestionsRoutePath, "utf8");

  assert.doesNotMatch(learningSite, /lesson01ReviewQuestions/);
  assert.doesNotMatch(learningSite, /lesson01ChallengeQuestions/);
  assert.doesNotMatch(learningSite, /lesson01QuestionTranslations/);
  assert.match(lessonQuestionsRoute, /lesson01QuestionTranslations/);
});

test("as páginas do curso verificam acesso antes de buscar as perguntas", () => {
  const learningSite = readFileSync(learningSitePath, "utf8");

  assert.match(
    learningSite,
    /const courseAccessSlideIndexes = new Set\(\[3, 5, 6, 9, 10, 12\]\);/,
  );
  assert.match(learningSite, /if \(!courseAccessSlideIndexes\.has\(slide\)\) return;/);
});
