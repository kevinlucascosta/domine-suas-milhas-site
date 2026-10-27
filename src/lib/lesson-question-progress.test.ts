import assert from "node:assert/strict";
import test from "node:test";

import {
  isLessonQuestionLocked,
  mergeLessonQuestionXpEntries,
  type LessonQuestionXpEntry,
} from "./lesson-question-progress";

const now = Date.UTC(2026, 9, 26, 12, 0, 0);

test("keeps an answer locked for exactly 24 hours", () => {
  assert.equal(isLessonQuestionLocked(now - 24 * 60 * 60 * 1000 + 1, now), true);
  assert.equal(isLessonQuestionLocked(now - 24 * 60 * 60 * 1000, now), false);
});

test("only adds XP when the server accepts a new correct attempt", () => {
  const current: LessonQuestionXpEntry[] = [
    { id: "review-milhas-01-100", amount: 5, awardedAt: 100 },
  ];

  assert.deepEqual(
    mergeLessonQuestionXpEntries(current, {
      accepted: false,
      questionId: "review-milhas-01",
      xpAwarded: 5,
      answeredAt: 100,
    }),
    current,
  );

  assert.deepEqual(
    mergeLessonQuestionXpEntries(current, {
      accepted: true,
      questionId: "challenge-milhas-01",
      xpAwarded: 10,
      answeredAt: 200,
    }),
    [
      ...current,
      { id: "challenge-milhas-01-200", amount: 10, awardedAt: 200 },
    ],
  );
});
