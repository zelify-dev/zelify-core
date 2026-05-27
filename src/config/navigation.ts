export type ZelifyTopNavItem = {
  /** Stable id for routing logic and dropdown maps — not shown to the user. */
  id: string;
  labelKey: string;
  href: string;
  hasDropdown?: boolean;
};

export type ZelifyAccountingSubNavItem = {
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
  { id: "lim", labelKey: "nav.top.lim", href: "/lcc" },
  { id: "activities", labelKey: "nav.top.activities", href: "/activities" },
  { id: "branches", labelKey: "nav.top.branches", href: "/branches" },
  { id: "products", labelKey: "nav.top.products", href: "/products" },
  { id: "reporting", labelKey: "nav.top.reporting", href: "/reporting" },
  { id: "accounting", labelKey: "nav.top.accounting", href: "/accounting" },
  { id: "administration", labelKey: "nav.top.administration", href: "/settings" },
  { id: "mdc", labelKey: "nav.top.mdc", href: "/mdc" },
];

const ADMIN_PREFIX = "/settings";
const ACCOUNTING_PREFIX = "/accounting";

export const zelifyAccountingSubNavItems: ZelifyAccountingSubNavItem[] = [
  {
    id: "balanceSheet",
    labelKey: "nav.dropdowns.accounting.balanceSheet",
    href: "/accounting/balance-sheet",
  },
  {
    id: "interestAccrualBreakdown",
    labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown",
    href: "/accounting/interest-accrual-breakdown",
  },
];

export function isAdministrationPath(pathname: string): boolean {
  return pathname === ADMIN_PREFIX || pathname.startsWith(`${ADMIN_PREFIX}/`);
}

export function isAccountingPath(pathname: string): boolean {
  return pathname === ACCOUNTING_PREFIX || pathname.startsWith(`${ACCOUNTING_PREFIX}/`);
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

export function resolveActiveAccountingSubNavId(
  pathname: string,
  items: ZelifyAccountingSubNavItem[] = zelifyAccountingSubNavItems
): string | null {
  if (!isAccountingPath(pathname)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.id;
    }
  }
  return "balanceSheet";
}
