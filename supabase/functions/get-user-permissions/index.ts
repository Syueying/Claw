import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUBSCRIPTION_DAYS = 30;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const { username } = await req.json();
    if (!username) {
      return json({ success: false, msg: "Missing username" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: user, error } = await supabase
      .from("users")
      .select("permission_codes, updated_at")
      .eq("username", username)
      .single();

    if (error || !user) {
      return json({ success: false, msg: "User not found" }, 404);
    }

    const permCode = Number(user.permission_codes ?? 0);
    let effectiveCode = permCode;

    // Option B: expiry = updated_at + SUBSCRIPTION_DAYS
    if (permCode !== 0 && user.updated_at) {
      const expireMs =
        new Date(user.updated_at).getTime() + SUBSCRIPTION_DAYS * 86_400_000;
      if (expireMs < Date.now()) {
        effectiveCode = 0;
        // Auto-downgrade in DB so future calls are consistent
        await supabase
          .from("users")
          .update({ permission_codes: 0 })
          .eq("username", username);
      }
    }

    return json({
      success: true,
      permission_codes: effectiveCode,
      updated_at: user.updated_at ?? null,
    });
  } catch (e) {
    return json({ success: false, msg: String(e) }, 500);
  }
});

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
