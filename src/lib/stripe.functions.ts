import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRICE_ID = "price_1Tl8oA06sULzbFVFvEPSZUZk";

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);

    const origin =
      getRequestHeader("origin") ??
      (getRequestHeader("referer")
        ? new URL(getRequestHeader("referer")!).origin
        : "http://localhost:8080");

    const email =
      (context.claims as { email?: string }).email ?? undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${origin}/perfil?premium=success`,
      cancel_url: `${origin}/perfil`,
      client_reference_id: context.userId,
      customer_email: email,
    });

    return { url: session.url };
  });
