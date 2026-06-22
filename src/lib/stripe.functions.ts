import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PRICE_ID = "price_1Tl8oA06sULzbFVFvEPSZUZk";

function getOrigin() {
  return (
    getRequestHeader("origin") ??
    (getRequestHeader("referer")
      ? new URL(getRequestHeader("referer")!).origin
      : "http://localhost:8080")
  );
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);

    const origin = getOrigin();
    const email = (context.claims as { email?: string }).email ?? undefined;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      success_url: `${origin}/perfil?premium=success`,
      cancel_url: `${origin}/perfil`,
      client_reference_id: context.userId,
      customer_email: email,
    });

    if (session.customer) {
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer.id;
      await context.supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", context.userId);
    }

    return { url: session.url };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const { data: profile, error } = await context.supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    const customerId = (profile as { stripe_customer_id?: string | null } | null)
      ?.stripe_customer_id;
    if (!customerId) throw new Error("No se encontró una suscripción activa");

    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secretKey);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${getOrigin()}/perfil`,
    });

    return { url: session.url };
  });
