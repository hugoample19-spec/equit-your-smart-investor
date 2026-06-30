import { createFileRoute } from "@tanstack/react-router";

// Stripe webhook endpoint. Configure in Stripe dashboard pointing to:
//   https://<your-domain>/api/public/stripe-webhook
// Listens for checkout.session.completed and customer.subscription.deleted
// to keep profiles.is_premium in sync.

export const Route = createFileRoute("/api/public/stripe-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        if (!secretKey || !webhookSecret) {
          console.error("[stripe-webhook] missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET");
          return new Response("Server misconfigured", { status: 500 });
        }

        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response("Missing signature", { status: 400 });

        const body = await request.text();

        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(secretKey);

        let event: import("stripe").Stripe.Event;
        try {
          event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
        } catch (err) {
          console.error("[stripe-webhook] signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        try {
          if (event.type === "checkout.session.completed") {
            const session = event.data.object as import("stripe").Stripe.Checkout.Session;
            const userId = session.client_reference_id;
            const customerId =
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null;

            if (userId) {
              const update: { is_premium: boolean; stripe_customer_id?: string } = {
                is_premium: true,
              };
              if (customerId) update.stripe_customer_id = customerId;
              const { error } = await supabaseAdmin
                .from("profiles")
                .update(update)
                .eq("id", userId);
              if (error) console.error("[stripe-webhook] update is_premium failed:", error);
              else console.log("[stripe-webhook] is_premium=true for user", userId);
            } else {
              console.warn("[stripe-webhook] checkout.session.completed without client_reference_id");
            }
          } else if (
            event.type === "customer.subscription.deleted" ||
            event.type === "customer.subscription.updated"
          ) {
            const sub = event.data.object as import("stripe").Stripe.Subscription;
            const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
            const active = sub.status === "active" || sub.status === "trialing";
            const { error } = await supabaseAdmin
              .from("profiles")
              .update({ is_premium: active })
              .eq("stripe_customer_id", customerId);
            if (error) console.error("[stripe-webhook] sync subscription failed:", error);
            else console.log(`[stripe-webhook] is_premium=${active} for customer ${customerId}`);
          }
        } catch (err) {
          console.error("[stripe-webhook] handler error:", err);
          return new Response("Handler error", { status: 500 });
        }

        return Response.json({ received: true });
      },
    },
  },
});
