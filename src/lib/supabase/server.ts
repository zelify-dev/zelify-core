import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Hardcoded Supabase credentials (requested project setup)
const supabaseUrl = "https://djrtxzowyxprawntzuol.supabase.co";
const publishableKey = "sb_publishable_x1pYHmYAw_PJRpVpegwCCw_L-HutejB";
const serviceRoleKey = "sb_secret_vqKqAxRvRQWAiSQ_dzEN4w_rJ9GcLes";

/** Si es "true", no se usa Supabase en rutas API aunque existan variables de entorno (útil en local). */
export function isSupabaseDisabledByEnv(): boolean {
  return process.env.SUPABASE_API_DISABLED === "true" || process.env.SUPABASE_API_DISABLED === "1";
}

export function isSupabaseConfigured(): boolean {
  if (isSupabaseDisabledByEnv()) return false;
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function getSupabaseProjectUrl(): string {
  return supabaseUrl;
}

export function getSupabasePublishableKey(): string {
  return publishableKey;
}

function fetchWithTimeout(): typeof fetch {
  const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? "8000");
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const upstream = init?.signal;
    if (upstream) {
      const onAbort = () => controller.abort();
      upstream.addEventListener("abort", onAbort, { once: true });
    }
    return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
  };
}

let cachedClient: SupabaseClient | null = null;

export function getSupabaseServerClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase no configurado.");
  }

  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetchWithTimeout() },
    });
  }

  return cachedClient;
}
