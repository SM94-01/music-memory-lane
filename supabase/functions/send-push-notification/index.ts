// Supabase Edge Function: send-push-notification
// Sends an FCM push notification (HTTP v1) to all devices registered for a user.
//
// Body: { user_id: string; title: string; body: string; data?: Record<string,string> }
// Env:  FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
//       SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (auto-provided)

// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (status: number, payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// ---------- Google OAuth2 access token (service account JWT) ----------

function base64UrlEncode(bytes: Uint8Array | string): string {
  const b = typeof bytes === "string"
    ? btoa(bytes)
    : btoa(String.fromCharCode(...bytes));
  return b.replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp - 60 > Math.floor(Date.now() / 1000)) {
    return cachedToken.token;
  }

  const clientEmail = Deno.env.get("FIREBASE_CLIENT_EMAIL");
  const privateKey = Deno.env.get("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_CLIENT_EMAIL or FIREBASE_PRIVATE_KEY");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encPayload = base64UrlEncode(JSON.stringify(payload));
  const toSign = `${encHeader}.${encPayload}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKey),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(toSign)),
  );
  const jwt = `${toSign}.${base64UrlEncode(sig)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    throw new Error(`OAuth token error: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: now + (data.expires_in ?? 3600) };
  return cachedToken.token;
}

// ---------- Handler ----------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { success: false, error: "Method not allowed" });

  try {
    const { user_id, title, body, data } = await req.json();
    if (!user_id || !title || !body) {
      return json(400, { success: false, error: "user_id, title, body are required" });
    }

    const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
    if (!projectId) return json(500, { success: false, error: "Missing FIREBASE_PROJECT_ID" });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: tokens, error: tokErr } = await supabase
      .from("user_push_tokens")
      .select("id, token, platform")
      .eq("user_id", user_id);

    if (tokErr) return json(500, { success: false, error: tokErr.message });
    if (!tokens || tokens.length === 0) {
      return json(200, { success: true, sent: 0, message: "No tokens for user" });
    }

    const accessToken = await getAccessToken();
    const endpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

    // Only string values are allowed in FCM `data`.
    const dataPayload: Record<string, string> = {};
    if (data && typeof data === "object") {
      for (const [k, v] of Object.entries(data)) dataPayload[k] = String(v);
    }

    const invalidTokens: string[] = [];
    let sent = 0;
    const errors: Array<{ token: string; error: string }> = [];

    for (const row of tokens) {
      const message = {
        message: {
          token: row.token,
          notification: { title, body },
          data: dataPayload,
          android: { priority: "HIGH" },
        },
      };

      const r = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      if (r.ok) {
        sent++;
        // Best-effort last_seen update
        await supabase
          .from("user_push_tokens")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", row.id);
        continue;
      }

      const errText = await r.text();
      let errCode = "";
      try {
        errCode = JSON.parse(errText)?.error?.details?.[0]?.errorCode ?? "";
      } catch { /* ignore */ }

      // Prune tokens FCM says are gone.
      if (
        r.status === 404 ||
        errCode === "UNREGISTERED" ||
        errCode === "INVALID_ARGUMENT"
      ) {
        invalidTokens.push(row.token);
      }
      errors.push({ token: row.token.slice(0, 12) + "…", error: errText });
    }

    if (invalidTokens.length > 0) {
      await supabase.from("user_push_tokens").delete().in("token", invalidTokens);
    }

    return json(200, {
      success: true,
      sent,
      total: tokens.length,
      pruned: invalidTokens.length,
      errors: errors.length ? errors : undefined,
    });
  } catch (e) {
    console.error("[send-push-notification] error", e);
    return json(500, { success: false, error: (e as Error).message });
  }
});
