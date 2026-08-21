import { getStoredOrganization } from "@/lib/auth-api";

const getBaseUrl = (): string =>
  process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";

export const DEMO_BYPASS_ORG_ID = "demo-bypass-org";

export function getConfigOrgId(): string {
  return getStoredOrganization()?.id || DEMO_BYPASS_ORG_ID;
}

export type ConfigurationUserDTO = {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  userType: string;
  accessType: string;
  branches: string;
  mfa: boolean;
  status: "active" | "invited" | "locked";
};

/**
 * Fetches users from GET /configuration/users?orgId=<orgId>.
 * Should only be called for organizations that are NOT demo-bypass-org.
 */
export async function fetchConfigurationUsers(
  orgId: string
): Promise<ConfigurationUserDTO[]> {
  const params = new URLSearchParams({ orgId });
  const res = await fetch(
    `${getBaseUrl()}/configuration/users?${params.toString()}`
  );
  if (!res.ok) {
    throw new Error(`Error al obtener usuarios (${res.status})`);
  }
  return res.json();
}
