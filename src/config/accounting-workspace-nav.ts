export type AccountingWorkspaceSubNavItem = {
  label: string;
  href: string;
};

/** Pestañas del workspace Accounting (referencia Figma 3:70). */
export const accountingWorkspaceSubNavItems: AccountingWorkspaceSubNavItem[] = [
  { label: "Balance Sheet", href: "/accounting/balance-sheet" },
  { label: "Profit & Loss", href: "/accounting/profit-loss" },
  { label: "Trial Balance", href: "/accounting/trial-balance" },
  { label: "Journal Entries", href: "/accounting/journal-entries" },
  { label: "Interest Accrual Breakdown", href: "/accounting/interest-accrual-breakdown" },
  { label: "Chart Of Accounts", href: "/accounting/chart-of-accounts" },
  { label: "Closures", href: "/accounting/closures" },
];

export function resolveAccountingWorkspaceSubNavLabel(
  pathname: string,
  items: AccountingWorkspaceSubNavItem[] = accountingWorkspaceSubNavItems
): string | null {
  const prefix = "/accounting";
  if (!pathname.startsWith(prefix)) return null;
  if (pathname === prefix) return "Journal Entries";
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return "Journal Entries";
}
