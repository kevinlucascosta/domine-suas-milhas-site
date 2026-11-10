import assert from "node:assert/strict";
import test from "node:test";
import { parseQuizSubmission, QuizRequestGuard } from "./quiz-submission";

test("respostas anteriores não afetam outra conta nem uma nova tentativa", () => {
  const guard = new QuizRequestGuard();
  guard.setUser("a");
  const old = guard.begin("a");
  assert.ok(old && guard.isCurrent(old));
  guard.setUser("b");
  const current = guard.begin("b");
  assert.ok(current && guard.isCurrent(current));
  assert.equal(guard.isCurrent(old), false);
  assert.equal(guard.setUser("b"), false);
  assert.equal(guard.isCurrent(current), true);
});

test("uma resposta incorreta conserva o bloqueio informado pelo servidor", () => {
  const result = parseQuizSubmission([{
    correct: false,
    locked_until: "2026-11-08T12:00:00.000Z",
    retry_after_seconds: 86400,
    attempt_recorded: true,
    mission_key: null,
    xp_earned: null,
    completed_at: null,
    newly_completed: false,
  }]);
  assert.equal(result.correct, false);
  assert.equal(result.retryAfterSeconds, 86400);
  assert.equal(result.attemptRecorded, true);
  assert.equal(result.completion, null);
});

test("uma resposta correta finalizada retorna o XP confirmado", () => {
  const result = parseQuizSubmission([{
    correct: true,
    locked_until: null,
    retry_after_seconds: 0,
    attempt_recorded: false,
    mission_key: "quiz_module_01_complete",
    xp_earned: 150,
    completed_at: "2026-11-07T12:00:00.000Z",
    newly_completed: true,
  }]);
  assert.deepEqual(result.completion, {
    mission_key: "quiz_module_01_complete",
    xp_earned: 150,
    completed_at: "2026-11-07T12:00:00.000Z",
    newly_completed: true,
  });
});

test("selecionar a resposta correta sem finalizar ainda não concede XP", () => {
  const result = parseQuizSubmission([{
    correct: true,
    locked_until: null,
    retry_after_seconds: 0,
    attempt_recorded: false,
    mission_key: null,
    xp_earned: null,
    completed_at: null,
    newly_completed: false,
  }]);
  assert.equal(result.correct, true);
  assert.equal(result.completion, null);
});

test("um bloqueio anterior não é apresentado como nova resposta incorreta", () => {
  const result = parseQuizSubmission([{
    correct: false,
    locked_until: "2026-11-08T12:00:00.000Z",
    retry_after_seconds: 3600,
    attempt_recorded: false,
    mission_key: null,
    xp_earned: null,
    completed_at: null,
    newly_completed: false,
  }]);
  assert.equal(result.attemptRecorded, false);
  assert.equal(result.retryAfterSeconds, 3600);
});

test("uma resposta incompleta ou incoerente não concede XP no cliente", () => {
  assert.throws(() => parseQuizSubmission([]));
  assert.throws(() => parseQuizSubmission([{
    correct: false,
    locked_until: null,
    retry_after_seconds: 0,
    attempt_recorded: false,
    mission_key: "quiz_module_01_complete",
    xp_earned: 150,
    completed_at: "2026-11-07T12:00:00.000Z",
    newly_completed: true,
  }]));
  assert.throws(() => parseQuizSubmission([{
    correct: true,
    locked_until: null,
    retry_after_seconds: -1,
    attempt_recorded: false,
    mission_key: null,
    xp_earned: null,
    completed_at: null,
    newly_completed: false,
  }]));
  assert.throws(() => parseQuizSubmission([{
    correct: false,
    locked_until: null,
    retry_after_seconds: 0,
    attempt_recorded: false,
    mission_key: null,
    xp_earned: null,
    completed_at: null,
    newly_completed: false,
  }]));
});
