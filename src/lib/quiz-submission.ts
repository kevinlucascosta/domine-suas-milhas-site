export type QuizMissionCompletion = {
  mission_key: "quiz_module_01_complete";
  xp_earned: number;
  completed_at: string;
  newly_completed: boolean;
};

export type QuizSubmission = {
  correct: boolean;
  lockedUntil: string | null;
  retryAfterSeconds: number;
  attemptRecorded: boolean;
  completion: QuizMissionCompletion | null;
};

type QuizRequestToken = { userId: string; generation: number };

export class QuizRequestGuard {
  private userId: string | null = null;
  private generation = 0;

  setUser(userId: string | null): boolean {
    if (this.userId === userId) return false;
    this.userId = userId;
    this.generation += 1;
    return true;
  }

  begin(userId: string): QuizRequestToken | null {
    if (this.userId !== userId) return null;
    return { userId, generation: ++this.generation };
  }

  isCurrent(token: QuizRequestToken): boolean {
    return this.userId === token.userId && this.generation === token.generation;
  }
}

export function parseQuizSubmission(data: unknown): QuizSubmission {
  if (!Array.isArray(data) || data.length !== 1 || !data[0] || typeof data[0] !== "object") {
    throw new Error("invalid_quiz_response");
  }

  const row = data[0] as Record<string, unknown>;
  const { correct, locked_until, retry_after_seconds, attempt_recorded, mission_key, xp_earned, completed_at, newly_completed } = row;
  if (
    typeof correct !== "boolean" ||
    (locked_until !== null && typeof locked_until !== "string") ||
    typeof retry_after_seconds !== "number" ||
    !Number.isSafeInteger(retry_after_seconds) ||
    retry_after_seconds < 0 ||
    typeof attempt_recorded !== "boolean" ||
    typeof newly_completed !== "boolean" ||
    (locked_until === null) !== (retry_after_seconds === 0) ||
    (correct && retry_after_seconds > 0) ||
    (!correct && retry_after_seconds === 0) ||
    (attempt_recorded && (correct || retry_after_seconds === 0))
  ) {
    throw new Error("invalid_quiz_response");
  }

  const hasCompletion = mission_key !== null || xp_earned !== null || completed_at !== null;
  if (!hasCompletion) {
    if (newly_completed) throw new Error("invalid_quiz_response");
    return { correct, lockedUntil: locked_until, retryAfterSeconds: retry_after_seconds, attemptRecorded: attempt_recorded, completion: null };
  }

  if (
    !correct ||
    mission_key !== "quiz_module_01_complete" ||
    xp_earned !== 150 ||
    typeof completed_at !== "string" ||
    !completed_at
  ) {
    throw new Error("invalid_quiz_response");
  }

  return {
    correct,
    lockedUntil: locked_until,
    retryAfterSeconds: retry_after_seconds,
    attemptRecorded: attempt_recorded,
    completion: { mission_key, xp_earned, completed_at, newly_completed },
  };
}
