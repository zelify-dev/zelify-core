export type ZelifyTopNavItem = {
  /** Stable id for routing logic and dropdown maps — not shown to the user. */
  id: string;
  labelKey: string;
  href: string;
  hasDropdown?: boolean;
};

export type ZelifyAdminSubNavItem = {
  id: string;
  labelKey: string;
  href: string;
};

export const zelifyTopNavItems: ZelifyTopNavItem[] = [
  { id: "dashboard", labelKey: "nav.top.dashboard", href: "/" },
  { id: "clients", labelKey: "nav.top.clients", href: "/customers" },
  { id: "groups", labelKey: "nav.top.groups", href: "/groups" },
  { id: "loans", labelKey: "nav.top.loans", href: "/loans" },
  { id: "deposits", labelKey: "nav.top.deposits", href: "/deposits" },
  { id: "loanTransactions", labelKey: "nav.top.loanTransactions", href: "/loan-transactions" },
  { id: "depositTransactions", labelKey: "nav.top.depositTransactions", href: "/deposit-transactions" },
  { id: "activities", labelKey: "nav.top.activities", href: "/activities" },
  { id: "branches", labelKey: "nav.top.branches", href: "/branches" },
  { id: "products", labelKey: "nav.top.products", href: "/products" },
  { id: "reporting", labelKey: "nav.top.reporting", href: "/reports" },
  { id: "accounting", labelKey: "nav.top.accounting", href: "/accounting" },
  { id: "administration", labelKey: "nav.top.administration", href: "/settings" },
];

export const zelifyAdminSubNavItems: ZelifyAdminSubNavItem[] = [
  { id: "access", labelKey: "nav.admin.access", href: "/settings/access" },
  { id: "tasks", labelKey: "nav.admin.tasks", href: "/settings/tasks" },
  { id: "generalLabels", labelKey: "nav.admin.generalLabels", href: "/settings/general/labels" },
  { id: "generalBranding", labelKey: "nav.admin.generalBranding", href: "/settings/general/branding" },
  { id: "financialRates", labelKey: "nav.admin.financialRates", href: "/settings/financial/rates" },
  { id: "financialAccounting", labelKey: "nav.admin.financialAccounting", href: "/settings/financial/accounting" },
];

const ADMIN_PREFIX = "/settings";

export function isAdministrationPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Resuelve el id del ítem principal activo. Rutas más específicas primero.
 */
export function resolveActiveTopNavId(
  pathname: string,
  items: ZelifyTopNavItem[] = zelifyTopNavItems
): string {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }
  if (pathname === "/") {
    return "dashboard";
  }
  return "dashboard";
}

/**
 * Resuelve la sub-sección activa bajo Administración, o null si no aplica.
 */
export function resolveActiveAdminSubNavId(
  pathname: string,
  items: ZelifyAdminSubNavItem[] = zelifyAdminSubNavItems
): string | null {
  if (!isAdministrationPath(pathname)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }
  return "access";
}
