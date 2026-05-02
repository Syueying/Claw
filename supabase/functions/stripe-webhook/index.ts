/**
 * stripe-webhook
 *
 * Receives Stripe webhook events and grants Pro access after a successful payment.
 * Listens for: checkout.session.completed (with payment_status = "paid")
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY      — sk_live_... or sk_test_...
 *   STRIPE_WEBHOOK_SECRET  — whsec_... (from Stripe dashboard → Webhooks → signing secret)
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Register this endpoint in Stripe dashboard:
 *   https://<project-ref>.supabase.co/functions/v1/stripe-webhook
 * Listen for: checkout.session.completed
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    return new Response("Stripe not configured", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature!, webhookSecret);
  } catch (e) {
    return new Response(`Webhook signature verification failed: ${e}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ received: true, skipped: "unpaid" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const username = session.metadata?.username;
    if (!username) {
      return new Response("Missing username in metadata", { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("users")
      .update({ permission_codes: 1, updated_at: now })
      .eq("username", username);

    if (error) {
      console.error("DB update failed:", error.message);
      return new Response("DB update failed", { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
