import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";

export type CreateFinanceRequest = {
  orgId: string;
  personType: "natural" | "moral";
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
  product: string;
  amount: number;
  status?: string;
};

export type FinanceRequest = {
  id: string;
  orgId: string;
  personType: string;
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email: string;
  product: string;
  amount: number;
  status: string;
  riskLevel: string;
  riskScore: number;
  createdAt: string;
  updatedAt: string;
};

export async function fetchFinanceRequests(orgId: string, personType?: string): Promise<FinanceRequest[]> {
  const params = new URLSearchParams({ orgId });
  if (personType) params.set("personType", personType);
  const res = await fetch(`${getBaseUrl()}/finance-requests?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch finance requests (${res.status})`);
  return res.json();
}

export async function createFinanceRequest(body: CreateFinanceRequest): Promise<FinanceRequest> {
  const res = await fetch(`${getBaseUrl()}/finance-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create finance request (${res.status}): ${text.slice(0, 200)}`);
  }
  const created = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_CREATE",
      detail: "Solicitud creada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${created.id ? created.id.substring(0, 8) : Date.now()}`,
    });
  }
  return created;
}

export async function updateFinanceRequest(id: string, patch: Partial<CreateFinanceRequest> & { riskLevel?: string; riskScore?: number }): Promise<FinanceRequest | null> {
  const res = await fetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return null;
  const updated = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "REQUEST_UPDATE",
      detail: "Solicitud actualizada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-req-${id.substring(0, 8)}`,
    });
  }
  return updated;
}

export async function deleteFinanceRequest(id: string): Promise<boolean> {
  const res = await fetch(`${getBaseUrl()}/finance-requests/${id}`, {
    method: "DELETE",
  });
  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "REQUEST_DELETE",
        detail: "Solicitud eliminada",
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-req-del-${Date.now()}`,
      });
    }
  }
  return ok;
}