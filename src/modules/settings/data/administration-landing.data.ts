/** Hub Administration (/settings): solo estructura; textos en `i18n/messages` (`administrationHub.*`, títulos vía `nav.admin.*`). */

export type AdminPreviewItem = {
  id: string;
  enabled: boolean;
};

export const ADMIN_NON_PRODUCTION_PREVIEW: AdminPreviewItem[] = [
  { id: "objStorage", enabled: true },
  { id: "manualEod", enabled: false },
  { id: "futureAccDate", enabled: false },
];

export const ADMIN_EARLY_ACCESS_FEATURES: AdminPreviewItem[] = [
  { id: "accCutoff", enabled: true },
  { id: "crypto", enabled: true },
  { id: "audit", enabled: true },
  { id: "streaming", enabled: false },
  { id: "apiV2", enabled: true },
  { id: "multiCcy", enabled: true },
  { id: "sandboxSync", enabled: true },
  { id: "bulkImport", enabled: true },
  { id: "riskRules", enabled: true },
  { id: "notifications", enabled: true },
  { id: "reportsBeta", enabled: true },
  { id: "sso", enabled: true },
  { id: "webhooksBeta", enabled: true },
  { id: "labelsAi", enabled: true },
];

export type AdminHubCardIcon =
  | "general"
  | "financial"
  | "organization"
  | "access"
  | "products"
  | "fields"
  | "views"
  | "forms"
  | "sms"
  | "email"
  | "webhooks"
  | "streaming"
  | "templates"
  | "apps"
  | "tasks"
  | "data";

/** Alineado con claves de `nav.admin` y `administrationHub.descriptions` en i18n. */
export type AdminHubNavId =
  | "generalSetup"
  | "financialSetup"
  | "organization"
  | "access"
  | "products"
  | "fields"
  | "views"
  | "forms"
  | "sms"
  | "email"
  | "webhooks"
  | "eventsStreaming"
  | "templates"
  | "apps"
  | "tasks"
  | "data";

export type AdminHubCardDef = {
  navAdminId: AdminHubNavId;
  href: string;
  featured: boolean;
  icon: AdminHubCardIcon;
};

export const ADMIN_HUB_CARD_DEFS: readonly AdminHubCardDef[] = [
  { navAdminId: "generalSetup", href: "/settings/general", featured: true, icon: "general" },
  { navAdminId: "financialSetup", href: "/settings/financial", featured: false, icon: "financial" },
  { navAdminId: "organization", href: "/settings/organization", featured: false, icon: "organization" },
  { navAdminId: "access", href: "/settings/access", featured: false, icon: "access" },
  { navAdminId: "products", href: "/settings/products", featured: false, icon: "products" },
  { navAdminId: "fields", href: "/settings/fields", featured: false, icon: "fields" },
  { navAdminId: "views", href: "/settings/views", featured: false, icon: "views" },
  { navAdminId: "forms", href: "/settings/forms", featured: false, icon: "forms" },
  { navAdminId: "sms", href: "/settings/sms", featured: false, icon: "sms" },
  { navAdminId: "email", href: "/settings/email", featured: false, icon: "email" },
  { navAdminId: "webhooks", href: "/settings/webhooks", featured: false, icon: "webhooks" },
  { navAdminId: "eventsStreaming", href: "/settings/event-streaming", featured: false, icon: "streaming" },
  { navAdminId: "templates", href: "/settings/templates", featured: false, icon: "templates" },
  { navAdminId: "apps", href: "/settings/apps", featured: false, icon: "apps" },
  { navAdminId: "tasks", href: "/settings/tasks", featured: false, icon: "tasks" },
  { navAdminId: "data", href: "/settings/data", featured: false, icon: "data" },
];
