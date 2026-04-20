/**
 * Menús contextuales al hover en la barra principal (referencia Figma 27:195).
 * Las claves `labelKey` se resuelven con el traductor activo (`t`).
 */

import type { Translate } from "@/i18n/translate";

export type TopNavDropdownSourceEntry =
  | { kind: "item"; labelKey: string; href: string }
  | { kind: "separator" };

export type TopNavDropdownEntry =
  | { kind: "item"; label: string; href: string }
  | { kind: "separator" };

const Q = (base: string, view: string) => `${base}?view=${encodeURIComponent(view)}`;

const topNavDropdownsByNavId: Record<string, TopNavDropdownSourceEntry[]> = {
  clients: [
    { kind: "item", labelKey: "nav.dropdowns.clients.pendingApproval", href: Q("/customers", "pending-approval") },
    { kind: "item", labelKey: "nav.dropdowns.clients.allClients", href: "/customers" },
  ],
  groups: [
    { kind: "item", labelKey: "nav.dropdowns.groups.noActiveAccounts", href: Q("/groups", "sin-cuentas-activas") },
  ],
  loans: [
    { kind: "item", labelKey: "nav.dropdowns.loans.activeLoan", href: Q("/loans", "active-loan") },
    { kind: "item", labelKey: "nav.dropdowns.loans.overdue", href: Q("/loans", "en-atraso") },
    { kind: "item", labelKey: "nav.dropdowns.loans.cancelled", href: Q("/loans", "cancelada") },
  ],
  activities: [{ kind: "item", labelKey: "nav.dropdowns.activities.allActivities", href: "/activities" }],
  reporting: [
    { kind: "item", labelKey: "nav.dropdowns.reporting.indicators", href: Q("/reports", "indicators") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.earnings", href: Q("/reports", "earnings") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.risk", href: Q("/reports", "risk") },
  ],
  accounting: [
    { kind: "item", labelKey: "nav.dropdowns.accounting.balanceSheet", href: "/accounting/balance-sheet" },
    {
      kind: "item",
      labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown",
      href: "/accounting/interest-accrual-breakdown",
    },
  ],
};

export function getTopNavDropdown(navId: string): TopNavDropdownSourceEntry[] | null {
  const entries = topNavDropdownsByNavId[navId];
  return entries?.length ? entries : null;
}

export function resolveTopNavDropdown(entries: TopNavDropdownSourceEntry[], t: Translate): TopNavDropdownEntry[] {
  return entries.map((entry) =>
    entry.kind === "separator"
      ? entry
      : { kind: "item", label: t(entry.labelKey), href: entry.href }
  );
}
