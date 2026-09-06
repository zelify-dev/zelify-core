import { getAccessToken, getAuthBaseUrl } from "@/lib/auth-api";

export type ZelifyKycPrefill = {
  email: string;
  phone?: string;
  curp: string;
  firstNames?: string;
  lastNames?: string;
};

export type ZelifyKycSessionResponse = {
  sessionId: string;
  webviewUrl: string;
  expiresAt?: string;
};

export type ZelifyKycSessionStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "expired"
  | "rejected"
  | "failed";

/** identity: objeto o null. Nunca string. rfc siempre null → no mostrar. */
export type ZelifyKycIdentity = {
  firstNames: string | null;
  lastNames: string | null;
  curp: string | null;
  rfc: string | null;
  sex: string | null;
  birthDate: string | null;
  /** true = INE/liveness OK; false = REJECTED; null = aún no corre */
  ineMatched: boolean | null;
};

/** address: objeto o null. Nunca string. */
export type ZelifyKycAddress = {
  street: string | null;
  colony: string | null;
  municipality: string | null;
  state: string | null;
  zip: string | null;
};

export type ZelifyKycSessionDetail = {
  sessionId: string;
  status: ZelifyKycSessionStatus;
  /** En Auth se llama userId (null hasta register). En MDC se guarda como zelifyUserId. */
  userId: string | null;
  identity: ZelifyKycIdentity | null;
  address: ZelifyKycAddress | null;
  /** lists hoy = null → esconder bloque Listas en UI */
  lists: null;
  expiresAt?: string;
  /**
   * El GET de Zelify NO trae token. No usar para abrir/copiar.
   * Link operable = kycWebviewUrl de MDC.
   */
  webviewUrl?: string;
};

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error("No hay access_token de Zelify. Inicia sesión de nuevo.");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function resolveKycWebviewUrl(webviewUrl: string): string {
  const trimmed = (webviewUrl || "").trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/session/")) return `https://kyc.zelify.com${trimmed}`;
  return trimmed;
}

function normalizeSessionStatus(raw: unknown): ZelifyKycSessionStatus {
  const value = String(raw || "pending").toLowerCase().replace(/\s+/g, "_");
  if (
    value === "pending" ||
    value === "in_progress" ||
    value === "completed" ||
    value === "expired" ||
    value === "rejected" ||
    value === "failed"
  ) {
    return value;
  }
  if (value === "complete" || value === "done" || value === "approved") return "completed";
  if (value === "in-progress" || value === "processing") return "in_progress";
  if (value === "expire" || value === "expired_link") return "expired";
  if (value === "reject" || value === "declined") return "rejected";
  if (value === "error") return "failed";
  return "pending";
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length ? text : null;
}

function asNullableBoolean(value: unknown): boolean | null {
  if (value === true || value === false) return value;
  return null;
}

/** identity/address: solo objeto o null. Nunca string. */
function parseIdentity(raw: unknown): ZelifyKycIdentity | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    firstNames: asNullableString(obj.firstNames ?? obj.first_names),
    lastNames: asNullableString(obj.lastNames ?? obj.last_names),
    curp: asNullableString(obj.curp),
    rfc: null,
    sex: asNullableString(obj.sex),
    birthDate: asNullableString(obj.birthDate ?? obj.birth_date),
    ineMatched: asNullableBoolean(obj.ineMatched ?? obj.ine_matched),
  };
}

function parseAddress(raw: unknown): ZelifyKycAddress | null {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const obj = raw as Record<string, unknown>;
  return {
    street: asNullableString(obj.street),
    colony: asNullableString(obj.colony),
    municipality: asNullableString(obj.municipality),
    state: asNullableString(obj.state),
    zip: asNullableString(obj.zip),
  };
}

function mapSessionDetail(data: any): ZelifyKycSessionDetail {
  const sessionId = data?.sessionId || data?.session_id || data?.id;
  // Auth JSON trae userId (no zelifyUserId).
  const userId = asNullableString(data?.userId ?? data?.user_id);
  return {
    sessionId: String(sessionId || ""),
    status: normalizeSessionStatus(data?.status),
    userId,
    identity: parseIdentity(data?.identity),
    address: parseAddress(data?.address),
    lists: null,
    expiresAt: data?.expiresAt || data?.expires_at,
    webviewUrl: data?.webviewUrl || data?.webview_url,
  };
}

/**
 * Crea sesión KYC onboarding Zelify.
 * Auth: solo Bearer del login. Sin x-api-key / secrets en el front.
 */
export async function createZelifyKycOnboardingSession(
  prefill: ZelifyKycPrefill,
): Promise<ZelifyKycSessionResponse> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const res = await fetch(`${base}/api/v2/kyc-onboarding/sessions`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ prefill }),
  });

  if (!res.ok) {
    let message = `No se pudo crear la sesión KYC (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const data = await res.json();
  const sessionId = data.sessionId || data.session_id || data.id;
  const rawUrl = data.webviewUrl || data.webview_url || data.url || "";
  if (!sessionId || !rawUrl) {
    throw new Error("La respuesta KYC no incluye sessionId/webviewUrl.");
  }

  return {
    sessionId: String(sessionId),
    webviewUrl: resolveKycWebviewUrl(String(rawUrl)),
    expiresAt: data.expiresAt || data.expires_at,
  };
}

/**
 * Consulta estado de sesión KYC.
 * No usar webviewUrl de esta respuesta para el link (sin token). Usar kycWebviewUrl de MDC.
 */
export async function fetchZelifyKycOnboardingSession(
  kycSessionId: string,
): Promise<ZelifyKycSessionDetail> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const res = await fetch(
    `${base}/api/v2/kyc-onboarding/sessions/${encodeURIComponent(kycSessionId)}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );

  if (!res.ok) {
    let message = `No se pudo consultar KYC (${res.status})`;
    try {
      const err = await res.json();
      if (err?.message) message = err.message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }

  const payload = await res.json();
  const data = payload?.data || payload;
  return mapSessionDetail(data);
}

/** Bonus: buscar sesión por CURP. */
export async function fetchZelifyKycOnboardingSessionByCurp(
  curp: string,
): Promise<ZelifyKycSessionDetail | null> {
  const base = getAuthBaseUrl().replace(/\/$/, "");
  const cleaned = curp.replace(/\s+/g, "").toUpperCase();
  const res = await fetch(
    `${base}/api/v2/kyc-onboarding/sessions?curp=${encodeURIComponent(cleaned)}`,
    {
      method: "GET",
      headers: authHeaders(),
    },
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`No se pudo buscar KYC por CURP (${res.status})`);
  }
  const payload = await res.json();
  const data = Array.isArray(payload) ? payload[0] : payload?.data || payload;
  if (!data) return null;
  return mapSessionDetail(data);
}

/** CURP mexicana: 18 caracteres alfanuméricos (sin espacios). */
export function isCurpLike(identificationNumber: string): boolean {
  const cleaned = identificationNumber.replace(/\s+/g, "").toUpperCase();
  return cleaned.length === 18 && /^[A-Z0-9]{18}$/.test(cleaned);
}

/** Normaliza teléfono a 10 dígitos (sin +52). */
export function normalizeMxPhone10(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("52")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return digits.slice(-10);
}

/** Etiqueta UI a partir del status Zelify (dueño del estado). */
export function kycStatusLabel(status: ZelifyKycSessionStatus | null | undefined): string {
  switch (status) {
    case "completed":
      return "Verificación completa";
    case "expired":
      return "Link vencido";
    case "rejected":
    case "failed":
      return "Verificación no aprobada";
    case "pending":
    case "in_progress":
    default:
      return "Verificación pendiente";
  }
}

export function formatIneMatched(ineMatched: boolean | null | undefined): string | null {
  if (ineMatched === true) return "INE / liveness OK";
  if (ineMatched === false) return "Documento rechazado";
  return null;
}

/** Une campos no-null con separador; si todos null → null (no inventar "OK"). */
export function joinKycFields(parts: Array<string | null | undefined>, sep = " · "): string | null {
  const values = parts.map((p) => (p == null ? "" : String(p).trim())).filter(Boolean);
  return values.length ? values.join(sep) : null;
}

export function formatKycIdentitySummary(identity: ZelifyKycIdentity | null): string | null {
  if (!identity) return null;
  const name = joinKycFields([identity.firstNames, identity.lastNames], " ");
  const ine = formatIneMatched(identity.ineMatched);
  return joinKycFields([name, identity.curp, identity.sex, identity.birthDate, ine]);
}

export function formatKycAddressSummary(address: ZelifyKycAddress | null): string | null {
  if (!address) return null;
  return joinKycFields([
    address.street,
    address.colony,
    address.municipality,
    address.state,
    address.zip,
  ]);
}
