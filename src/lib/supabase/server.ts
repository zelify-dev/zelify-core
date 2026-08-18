import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
let supabaseRuntimeUnavailable = false;

/** Si es "true", no se usa Supabase en rutas API aunque existan variables de entorno (útil en local). */
export function isSupabaseDisabledByEnv(): boolean {
  return process.env.SUPABASE_API_DISABLED === "true" || process.env.SUPABASE_API_DISABLED === "1";
}

export function isSupabaseConfigured(): boolean {
  if (isSupabaseDisabledByEnv()) return false;
  if (supabaseRuntimeUnavailable) return false;
  return Boolean(supabaseUrl && serviceRoleKey);
}

export function getSupabaseProjectUrl(): string {
  return supabaseUrl;
}

export function getSupabasePublishableKey(): string {
  return publishableKey;
}

function fetchWithTimeout(): typeof fetch {
  const timeoutMs = Number(process.env.SUPABASE_FETCH_TIMEOUT_MS ?? "1500");
  return (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const upstream = init?.signal;
    if (upstream) {
      const onAbort = () => controller.abort();
      upstream.addEventListener("abort", onAbort, { once: true });
    }
    return fetch(input, { ...init, signal: controller.signal })
      .catch((error) => {
        supabaseRuntimeUnavailable = true;
        throw error;
      })
      .finally(() => clearTimeout(timer));
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
