/**
 * create-checkout-session
 *
 * Creates a Stripe Checkout session for a one-time 30-day Pro subscription.
 * Expected body: { username: string, successUrl: string, cancelUrl: string }
 *   username   — SHA-256 hashed username (stored in metadata for webhook)
 *   successUrl — where Stripe redirects after successful payment
 *   cancelUrl  — where Stripe redirects on cancel
 *
 * Required Supabase secrets:
 *   STRIPE_SECRET_KEY  — sk_live_... or sk_test_...
 *   STRIPE_PRICE_ID    — price_... (one-time price for 30-day Pro access)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { username, successUrl, cancelUrl } = await req.json() as {
      username?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    if (!username) {
      return json({ error: "Missing username" }, 400);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const priceId = Deno.env.get("STRIPE_PRICE_ID");

    if (!stripeKey || !priceId) {
      return json({ error: "Payment not configured" }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { username },
      success_url: successUrl ?? "",
      cancel_url: cancelUrl ?? "",
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
