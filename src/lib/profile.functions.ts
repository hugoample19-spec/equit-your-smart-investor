import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export const validateDisplayName = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ name: z.string().min(1).max(40) }).parse(d))
  .handler(async ({ data }) => {
    const name = data.name.trim();
    // Profanity check
    const { Filter } = await import("bad-words");
    try {
      if (new Filter().isProfane(name)) {
        return { ok: false as const, reason: "profanity" as const };
      }
    } catch {
      // ignore filter errors
    }
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { data: existing, error } = await supabase
      .from("profiles")
      .select("id")
      .ilike("display_name", name)
      .limit(1);
    if (error) throw error;
    if (existing && existing.length > 0) {
      return { ok: false as const, reason: "taken" as const };
    }
    return { ok: true as const };
  });

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const completeOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ startingBalance: z.number().min(0) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ starting_balance: data.startingBalance, onboarded: true })
      .eq("id", context.userId);
    if (error) throw error;
    // Initial cash deposit
    await context.supabase.from("transactions").insert({
      user_id: context.userId,
      ticker: "CASH",
      type: "deposit",
      amount: data.startingBalance,
    });
    return { ok: true };
  });

export const updateProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      display_name: z.string().optional(),
      username: z.string().optional(),
      avatar_url: z.string().nullable().optional(),
      is_portfolio_public: z.boolean().optional(),
      favorite_referente_id: z.string().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update(data)
      .eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
