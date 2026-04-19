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
    { kind: "item", labelKey: "nav.dropdowns.clients.f1Pilot", href: Q("/customers", "f1-pilot") },
    { kind: "item", labelKey: "nav.dropdowns.clients.tennisPlayer", href: Q("/customers", "tennis-player") },
    { kind: "item", labelKey: "nav.dropdowns.clients.activeClients", href: Q("/customers", "active-clients") },
    { kind: "item", labelKey: "nav.dropdowns.clients.inactive", href: Q("/customers", "inactive") },
    { kind: "item", labelKey: "nav.dropdowns.clients.pendingApproval", href: Q("/customers", "pending-approval") },
    { kind: "item", labelKey: "nav.dropdowns.clients.setAside", href: Q("/customers", "set-aside") },
    { kind: "item", labelKey: "nav.dropdowns.clients.blacklist", href: Q("/customers", "blacklist") },
    { kind: "separator" },
    { kind: "item", labelKey: "nav.dropdowns.clients.allClients", href: "/customers" },
  ],
  groups: [
    { kind: "item", labelKey: "nav.dropdowns.groups.activeLoans", href: Q("/groups", "active-loans") },
    { kind: "item", labelKey: "nav.dropdowns.groups.activeDeposits", href: Q("/groups", "active-deposits") },
    { kind: "item", labelKey: "nav.dropdowns.groups.noActiveAccounts", href: Q("/groups", "sin-cuentas-activas") },
    { kind: "item", labelKey: "nav.dropdowns.groups.noMembers", href: Q("/groups", "sin-miembros") },
    { kind: "separator" },
    { kind: "item", labelKey: "nav.dropdowns.groups.allGroups", href: "/groups" },
  ],
  loans: [
    { kind: "item", labelKey: "nav.dropdowns.loans.activeLoan", href: Q("/loans", "active-loan") },
    { kind: "item", labelKey: "nav.dropdowns.loans.pendingApproval", href: Q("/loans", "pending-approval") },
    { kind: "item", labelKey: "nav.dropdowns.loans.pendingDisbursement", href: Q("/loans", "pendiente-desembolso") },
    { kind: "item", labelKey: "nav.dropdowns.loans.overdue", href: Q("/loans", "en-atraso") },
    { kind: "item", labelKey: "nav.dropdowns.loans.close", href: Q("/loans", "close") },
    { kind: "item", labelKey: "nav.dropdowns.loans.renegotiated", href: Q("/loans", "renegociada") },
    { kind: "item", labelKey: "nav.dropdowns.loans.cancelled", href: Q("/loans", "cancelada") },
    { kind: "separator" },
    { kind: "item", labelKey: "nav.dropdowns.loans.allLoanAccounts", href: "/loans" },
  ],
  activities: [{ kind: "item", labelKey: "nav.dropdowns.activities.allActivities", href: "/activities" }],
  reporting: [
    { kind: "item", labelKey: "nav.dropdowns.reporting.indicators", href: Q("/reports", "indicators") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.portfolio", href: Q("/reports", "portfolio") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.organization", href: Q("/reports", "organization") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.earnings", href: Q("/reports", "earnings") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.cashflow", href: Q("/reports", "cashflow") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.outreach", href: Q("/reports", "outreach") },
    { kind: "item", labelKey: "nav.dropdowns.reporting.risk", href: Q("/reports", "risk") },
  ],
  accounting: [
    { kind: "item", labelKey: "nav.dropdowns.accounting.balanceSheet", href: Q("/accounting", "balance-sheet") },
    { kind: "item", labelKey: "nav.dropdowns.accounting.profitLoss", href: Q("/accounting", "profit-loss") },
    { kind: "item", labelKey: "nav.dropdowns.accounting.trialBalance", href: Q("/accounting", "trial-balance") },
    { kind: "separator" },
    { kind: "item", labelKey: "nav.dropdowns.accounting.journalEntries", href: Q("/accounting", "journal-entries") },
    { kind: "item", labelKey: "nav.dropdowns.accounting.interestAccrualBreakdown", href: Q("/accounting", "interest-accrual") },
    { kind: "separator" },
    { kind: "item", labelKey: "nav.dropdowns.accounting.chartOfAccounts", href: Q("/accounting", "chart-of-accounts") },
    { kind: "item", labelKey: "nav.dropdowns.accounting.closures", href: Q("/accounting", "closures") },
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
