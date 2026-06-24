/** Credenciales de bypass solo para demo local (sin llamada al backend). */
export const DEV_BYPASS_EMAIL = "juan.proano@zwippe.com";
export const DEV_BYPASS_PASSWORD = "#pain070900Fire";
export const DEV_BYPASS_TOKEN = "dev-local-bypass-token";

export const DEV_BYPASS_USER = {
  id: "user-nexopay-admin",
  email: DEV_BYPASS_EMAIL,
  role: "business_admin",
  organization_id: "org-nexopay-demo",
  organizationId: "org-nexopay-demo",
};

export function isDevBypassCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === DEV_BYPASS_EMAIL.toLowerCase() &&
    password === DEV_BYPASS_PASSWORD
  );
}

export function establishDevBypassSession(): void {
  if (typeof window === "undefined") return;

  localStorage.setItem("zelify_access_token", DEV_BYPASS_TOKEN);
  localStorage.setItem("zelify_user", JSON.stringify(DEV_BYPASS_USER));
}
