export type ZelifyTopNavItem = {
  label: string;
  href: string;
  hasDropdown?: boolean;
};

export type ZelifyAdminSubNavItem = {
  label: string;
  href: string;
};

export const zelifyTopNavItems: ZelifyTopNavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Clients", href: "/customers" },
  { label: "Groups", href: "/groups" },
  { label: "Loans", href: "/loans" },
  { label: "Deposits", href: "/deposits" },
  { label: "Loan Transactions", href: "/loan-transactions" },
  { label: "Deposit Transactions", href: "/deposit-transactions" },
  { label: "Activities", href: "/activities" },
  { label: "Branches", href: "/branches" },
  { label: "Products", href: "/products" },
  { label: "Reporting", href: "/reports" },
  { label: "Accounting", href: "/accounting" },
  { label: "Administration", href: "/settings" },
];

export const zelifyAdminSubNavItems: ZelifyAdminSubNavItem[] = [
  { label: "General Setup", href: "/settings/general" },
  { label: "Financial Setup", href: "/settings/financial" },
  { label: "Organization", href: "/settings/organization" },
  { label: "Access", href: "/settings/access" },
  { label: "Products", href: "/settings/products" },
  { label: "Views", href: "/settings/views" },
  { label: "Forms", href: "/settings/forms" },
  { label: "Data", href: "/settings/data" },
  { label: "Tasks", href: "/settings/tasks" },
  { label: "Webhooks", href: "/settings/webhooks" },
];

const ADMIN_PREFIX = "/settings";

export function isAdministrationPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

/**
 * Resuelve la etiqueta del ítem principal activo. Rutas más específicas primero.
 */
export function resolveActiveTopNavLabel(
  pathname: string,
  items: ZelifyTopNavItem[] = zelifyTopNavItems
): string {
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  if (pathname === "/") {
    return "Dashboard";
  }
  return "Dashboard";
}

/**
 * Resuelve la sub-sección activa bajo Administración, o null si no aplica.
 */
export function resolveActiveAdminSubNavLabel(
  pathname: string,
  items: ZelifyAdminSubNavItem[] = zelifyAdminSubNavItems
): string | null {
  if (!isAdministrationPath(pathname)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return "General Setup";
}
