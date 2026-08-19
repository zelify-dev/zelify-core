import { getStoredOrganization } from "@/lib/auth-api";
import { createTraceabilityLog } from "./mdc-traceability.service";
import { customFetch } from "./mdc-api-client";
const API_URL = process.env.NEXT_PUBLIC_MDC_API_URL || "http://localhost:3000";

export type GeneralSettings = {
  companyName: string;
  legalName: string;
  taxId: string;
  supportEmail: string;
  supportPhone: string;
  address: string;
  timezone: string;
  currency: string;
};

export type RoleRow = {
  id?: string;
  name: string;
  description: string;
  permissions: string;
};

export type UserRow = {
  id?: string;
  fullName: string;
  email: string;
  role?: RoleRow | string;
  status: "active" | "inactive";
};

export type ExportJob = {
  id?: string;
  name: string;
  date: string;
  status: "completed" | "running" | "failed";
  type: "clients" | "applications" | "payments" | "collections" | "lostPayments" | "underwritingResults" | "kycResults" | "full";
};

// General Settings
export async function getGeneralSettings(): Promise<GeneralSettings> {
  const res = await customFetch(`${API_URL}/configuration/general`);
  if (!res.ok) throw new Error("Failed to fetch general settings");
  return res.json();
}

export async function updateGeneralSettings(data: GeneralSettings): Promise<GeneralSettings> {
  const res = await customFetch(`${API_URL}/configuration/general`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update general settings");
  const updated = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "CONFIG_UPDATE",
      detail: "Configuración actualizada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-gen-${Date.now()}`,
    });
  }
  return updated;
}

// Roles
export async function getRoles(): Promise<RoleRow[]> {
  const res = await customFetch(`${API_URL}/configuration/roles`);
  if (!res.ok) throw new Error("Failed to fetch roles");
  return res.json();
}

export async function createRole(data: Partial<RoleRow>): Promise<RoleRow> {
  const res = await customFetch(`${API_URL}/configuration/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create role");
  const created = await res.json();
  const orgId = getStoredOrganization()?.id || "demo-bypass-org";
  if (orgId !== "demo-bypass-org") {
    await createTraceabilityLog({
      orgId,
      action: "CONFIG_CREATE",
      detail: "Configuración creada",
      channel: "Consola",
      userName: "Ejecutivo Zelify",
      correlationId: `corr-cfg-${created.id ? created.id.substring(0, 8) : Date.now()}`,
    });
  }
  return created;
}

export async function deleteRole(id: string): Promise<boolean> {
  const res = await customFetch(`${API_URL}/configuration/roles/${id}`, { method: "DELETE" });
  const ok = res.ok;
  if (ok) {
    const orgId = getStoredOrganization()?.id || "demo-bypass-org";
    if (orgId !== "demo-bypass-org") {
      await createTraceabilityLog({
        orgId,
        action: "CONFIG_DELETE",
        detail: "Configuración eliminada",
        channel: "Consola",
        userName: "Ejecutivo Zelify",
        correlationId: `corr-cfg-del-${Date.now()}`,
      });
    }
  }
  return ok;
}

// Users
export async function getUsers(): Promise<UserRow[]> {
  const res = await customFetch(`${API_URL}/configuration/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function createUser(data: Partial<UserRow>): Promise<UserRow> {
  const res = await customFetch(`${API_URL}/configuration/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

export async function deleteUser(id: string): Promise<boolean> {
  const res = await customFetch(`${API_URL}/configuration/users/${id}`, { method: "DELETE" });
  return res.ok;
}

// Exports
export async function getExportJobs(): Promise<ExportJob[]> {
  const res = await customFetch(`${API_URL}/configuration/exports`);
  if (!res.ok) throw new Error("Failed to fetch exports");
  return res.json();
}

export async function createExportJob(data: Partial<ExportJob>): Promise<ExportJob> {
  const res = await customFetch(`${API_URL}/configuration/exports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create export");
  return res.json();
}

export async function updateExportJobStatus(id: string, status: ExportJob["status"]): Promise<ExportJob> {
  const res = await customFetch(`${API_URL}/configuration/exports/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Failed to update export status");
  return res.json();
}
