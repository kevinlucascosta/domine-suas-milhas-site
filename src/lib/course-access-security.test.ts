import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
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

test("o cadastro confirma e-mail no callback e mantém a recuperação separada", () => {
  const learningSite = readFileSync(learningSitePath, "utf8");
  const signup = learningSite.match(/supabase\.auth\.signUp\(([\s\S]*?)\}\)/)?.[1];
  const recovery = learningSite.match(
    /supabase\.auth\.resetPasswordForEmail\(([\s\S]*?)\n\s*\);/,
  )?.[1];

  assert.ok(signup, "a chamada de cadastro deve existir");
  assert.ok(recovery, "a chamada de recuperação deve existir");
  assert.match(
    signup,
    /options:\s*\{\s*emailRedirectTo:\s*`\$\{window\.location\.origin\}\/auth\/callback`/,
  );
  assert.match(
    recovery,
    /redirectTo:\s*`\$\{window\.location\.origin\}\/auth\/recovery`/,
  );
});

test("a missão de perfil preserva conclusões e valida somente uma nova conclusão", () => {
  const migrationPath = resolve(
    process.cwd(),
    "supabase/migrations/20261106190000_validate_profile_completion_mission.sql",
  );
  assert.ok(existsSync(migrationPath), "a migration de validação deve existir");
  const migration = readFileSync(migrationPath, "utf8");

  assert.match(
    migration,
    /create or replace function public\.complete_learning_mission\(p_mission_key text\)\s+returns table \(mission_key text, xp_earned smallint, completed_at timestamptz, newly_completed boolean\)/i,
  );
  assert.match(migration, /security definer\s+set search_path = ''/i);
  assert.match(migration, /v_user_id uuid := auth\.uid\(\)/i);
  assert.match(migration, /if v_user_id is null then\s+raise exception 'not_authenticated'/i);

  const priorCompletion = migration.match(
    /select completion\.xp_earned, completion\.completed_at\s+into v_xp, v_completed_at\s+from public\.learning_mission_completions as completion\s+where completion\.user_id = v_user_id and completion\.mission_key = p_mission_key;\s+if found then\s+return query select p_mission_key, v_xp, v_completed_at, false;\s+return;\s+end if;/i,
  );
  const profileGuard = migration.match(
    /if p_mission_key = 'profile_complete' and not exists\s*\(([\s\S]*?)\) then\s+raise exception 'profile_incomplete';\s+end if;/i,
  );
  assert.ok(priorCompletion, "a conclusão do próprio aluno deve retornar sem nova validação");
  assert.ok(profileGuard, "a validação deve bloquear apenas uma nova profile_complete");
  assert.ok(priorCompletion.index! < profileGuard.index!);
  assert.ok(profileGuard.index! < migration.indexOf("insert into public.learning_mission_completions"));
  assert.match(profileGuard[1], /from public\.student_profiles as profile/i);
  assert.match(profileGuard[1], /profile\.user_id = v_user_id/i);
  assert.match(profileGuard[1], /char_length\(btrim\(profile\.display_name, v_profile_whitespace\)\) >= 2/i);
  assert.match(profileGuard[1], /char_length\(btrim\(profile\.full_name, v_profile_whitespace\)\) >= 2/i);
  assert.match(profileGuard[1], /coalesce\(trim\(profile\.country\), ''\) <> ''/i);
  assert.match(profileGuard[1], /coalesce\(cardinality\(profile\.favorite_programs\), 0\) > 0/i);

  assert.match(
    migration,
    /when 'profile_complete' then 20\s+when 'lesson_01_complete' then 50\s+when 'quiz_module_01_complete' then 150\s+when 'simulator_used' then 100\s+else null/i,
  );
  assert.match(migration, /raise exception 'unsupported_mission'/i);
  assert.match(migration, /on conflict[^;]+do nothing/i);
  assert.match(migration, /v_new := found;/i);
  assert.match(migration, /if not v_new then[\s\S]+completion\.user_id = v_user_id and completion\.mission_key = p_mission_key;/i);
  assert.match(migration, /return query select p_mission_key, v_xp, v_completed_at, v_new;/i);
  assert.match(migration, /revoke all on function public\.complete_learning_mission\(text\) from public, anon;/i);
  assert.match(migration, /grant execute on function public\.complete_learning_mission\(text\) to authenticated;/i);
});

test("os nomes do perfil removem o mesmo whitespace ASCII e Unicode de String.trim", () => {
  const migration = readFileSync(resolve(
    process.cwd(),
    "supabase/migrations/20261106190000_validate_profile_completion_mission.sql",
  ), "utf8");
  const whitespaceDeclaration = migration.match(
    /v_profile_whitespace constant text := U&'([^']+)';/i,
  );
  assert.ok(whitespaceDeclaration, "a migration deve declarar o whitespace de String.trim");
  const sqlWhitespace = whitespaceDeclaration[1].replace(
    /\\([0-9a-f]{4})/gi,
    (_, codePoint: string) => String.fromCodePoint(parseInt(codePoint, 16)),
  );
  const jsWhitespace = "\u0009\u000a\u000b\u000c\u000d\u0020\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000\ufeff";

  assert.equal(sqlWhitespace, jsWhitespace);
  for (const whitespaceOnlyName of ["\t\t", "\n\n", "\r\n", "\u00a0\u00a0", "\u2003\u2003", "\ufeff\ufeff", jsWhitespace]) {
    assert.equal(whitespaceOnlyName.trim(), "");
    assert.ok([...whitespaceOnlyName].every((character) => sqlWhitespace.includes(character)));
  }
});
