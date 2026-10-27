export type LessonQuestionXpEntry = {
  id: string;
  amount: number;
  awardedAt: number;
};

export const LESSON_QUESTION_LOCK_MS = 24 * 60 * 60 * 1000;

export function isLessonQuestionLocked(
  answeredAt: number,
  now = Date.now(),
) {
  return now - answeredAt < LESSON_QUESTION_LOCK_MS;
}

export function mergeLessonQuestionXpEntries(
  current: LessonQuestionXpEntry[],
  result: {
    accepted: boolean;
    questionId: string;
    xpAwarded: number;
    answeredAt: number;
  },
) {
  if (!result.accepted || result.xpAwarded <= 0) return current;

  const id = `${result.questionId}-${result.answeredAt}`;
  if (current.some((entry) => entry.id === id)) return current;

  return [
    ...current,
    { id, amount: result.xpAwarded, awardedAt: result.answeredAt },
  ];
}
