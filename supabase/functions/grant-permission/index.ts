/**
 * grant-permission
 *
 * Called by the payment gateway webhook after a successful payment.
 * Sets permission_codes = 1 and updated_at = NOW() for the given user,
 * starting a fresh 30-day subscription window.
 *
 * Expected body: { username: string, secret: string }
 *   username — the SHA-256 hashed username (same format stored in the DB)
 *   secret   — must match the GRANT_PERMISSION_SECRET env var to prevent
 *              unauthorized calls. Replace with gateway signature verification
 *              once a payment provider is chosen.
 *
 * To set the secret in Supabase:
 *   supabase secrets set GRANT_PERMISSION_SECRET=<random-32-char-string>
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = await req.json();
    const { username, secret } = body as { username?: string; secret?: string };

    // ── Auth ──────────────────────────────────────────────────────────────────
    const expectedSecret = Deno.env.get("GRANT_PERMISSION_SECRET");
    if (!expectedSecret || secret !== expectedSecret) {
      return json({ success: false, msg: "Unauthorized" }, 401);
    }

    if (!username) {
      return json({ success: false, msg: "Missing username" }, 400);
    }

    // ── DB update ─────────────────────────────────────────────────────────────
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
      return json({ success: false, msg: error.message }, 500);
    }

    return json({ success: true, updated_at: now });
  } catch (e) {
    return json({ success: false, msg: String(e) }, 500);
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
