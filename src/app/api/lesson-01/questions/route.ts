import { NextResponse } from "next/server";
import { lesson01ChallengeQuestions, lesson01ReviewQuestions } from "@/lib/lesson-01-content";
import { lesson01QuestionTranslations } from "@/lib/lesson-01-question-translations";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const supportedLanguages = ["pt-BR", "en", "pt-PT", "es", "ja", "zh"] as const;
type LessonLanguage = (typeof supportedLanguages)[number];

function localizeQuestion<T extends { id: string; prompt: string; options: string[]; explanation: string }>(
  question: T,
  language: LessonLanguage,
) {
  if (language === "pt-BR" || language === "pt-PT") return question;
  const translation = lesson01QuestionTranslations[language]?.[question.id];
  return translation ? { ...question, ...translation } : question;
}

export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: claims, error: claimsError } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { data: entitlement, error } = await supabase.from("entitlements").select("id").eq("user_id", userId).eq("status", "active").or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`).limit(1).maybeSingle();
  if (error) return NextResponse.json({ error: "access_check_unavailable" }, { status: 503 });
  if (!entitlement) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const language = new URL(request.url).searchParams.get("language");
  const selectedLanguage = supportedLanguages.includes(language as LessonLanguage)
    ? (language as LessonLanguage)
    : "pt-BR";

  return NextResponse.json(
    {
      review: lesson01ReviewQuestions.map((question) => localizeQuestion(question, selectedLanguage)),
      challenge: lesson01ChallengeQuestions.map((question) => localizeQuestion(question, selectedLanguage)),
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
