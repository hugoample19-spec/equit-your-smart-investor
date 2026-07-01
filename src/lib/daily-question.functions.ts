import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

function madridDateISO(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export type DailyQuestion = {
  id: string;
  question: string;
  options: string[];
  date: string;
};

export type DailyQuestionResult =
  | {
      ok: true;
      question: DailyQuestion;
      alreadyAnswered: boolean;
      wasCorrect: boolean | null;
      selectedIndex?: number | null;
      explanation?: string;
      correctIndex?: number;
    }
  | { ok: false; reason: "ai_failed" | "missing_ai_key" };

export const getDailyQuestion = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DailyQuestionResult> => {
    const today = madridDateISO();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Look up cached question
    let { data: q } = await supabaseAdmin
      .from("daily_questions")
      .select("*")
      .eq("date", today)
      .maybeSingle();

    if (!q) {
      const key = process.env.LOVABLE_API_KEY;
      if (!key) return { ok: false, reason: "missing_ai_key" };
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content:
                  "Eres un experto en mercados financieros. Genera una pregunta de cultura financiera o mercados para inversores jóvenes españoles. Responde ÚNICAMENTE en JSON válido, sin markdown ni texto adicional.",
              },
              {
                role: "user",
                content:
                  'Genera una pregunta diaria sobre mercados financieros, inversión o economía. Debe ser interesante y educativa, no demasiado técnica. Formato JSON exacto: {"question": "...", "options": ["A", "B", "C", "D"], "correct_index": 0, "explanation": "Breve explicación de por qué es correcta (1-2 frases)"}',
              },
            ],
          }),
        });
        if (!res.ok) return { ok: false, reason: "ai_failed" };
        const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
        let content = json.choices?.[0]?.message?.content?.trim() ?? "";
        // Strip potential markdown code fences
        content = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
        const parsed = JSON.parse(content) as {
          question: string;
          options: string[];
          correct_index: number;
          explanation: string;
        };
        if (
          !parsed.question ||
          !Array.isArray(parsed.options) ||
          parsed.options.length !== 4 ||
          typeof parsed.correct_index !== "number" ||
          parsed.correct_index < 0 ||
          parsed.correct_index > 3
        ) {
          return { ok: false, reason: "ai_failed" };
        }
        const { data: inserted, error } = await supabaseAdmin
          .from("daily_questions")
          .insert({
            question: parsed.question,
            options: parsed.options,
            correct_index: parsed.correct_index,
            explanation: parsed.explanation,
            date: today,
          })
          .select("*")
          .single();
        if (error || !inserted) return { ok: false, reason: "ai_failed" };
        q = inserted;
      } catch (e) {
        console.error("[daily-question] AI failed:", e);
        return { ok: false, reason: "ai_failed" };
      }
    }

    // Check user's answer
    const { data: answer } = await context.supabase
      .from("daily_question_answers")
      .select("is_correct")
      .eq("user_id", context.userId)
      .eq("question_date", today)
      .maybeSingle();

    const alreadyAnswered = !!answer;
    return {
      ok: true,
      question: {
        id: q.id,
        question: q.question,
        options: q.options as string[],
        date: q.date,
      },
      alreadyAnswered,
      wasCorrect: answer?.is_correct ?? null,
      explanation: alreadyAnswered ? q.explanation : undefined,
      correctIndex: alreadyAnswered ? q.correct_index : undefined,
    };
  });

export const answerDailyQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ selectedIndex: z.number().int().min(0).max(3) }).parse(d))
  .handler(async ({ data, context }) => {
    const today = madridDateISO();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Check if already answered
    const { data: existing } = await context.supabase
      .from("daily_question_answers")
      .select("is_correct")
      .eq("user_id", context.userId)
      .eq("question_date", today)
      .maybeSingle();

    // Load question
    const { data: q } = await supabaseAdmin
      .from("daily_questions")
      .select("correct_index, explanation")
      .eq("date", today)
      .maybeSingle();
    if (!q) throw new Error("No daily question for today");

    if (existing) {
      return {
        alreadyAnswered: true as const,
        wasCorrect: existing.is_correct,
        explanation: q.explanation,
        correctIndex: q.correct_index,
      };
    }

    const isCorrect = data.selectedIndex === q.correct_index;
    const { error } = await context.supabase
      .from("daily_question_answers")
      .insert({
        user_id: context.userId,
        question_date: today,
        is_correct: isCorrect,
      });
    if (error) throw error;

    return {
      alreadyAnswered: false as const,
      isCorrect,
      explanation: q.explanation,
      correctIndex: q.correct_index,
    };
  });
