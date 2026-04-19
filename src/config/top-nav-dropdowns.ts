/**
 * Entradas del menú contextual al hover en la barra principal (referencia Figma 27:195).
 * Cada ítem enlaza a la sección base; las vistas guardadas pueden refinarse con query/hash más adelante.
 */

export type TopNavDropdownEntry =
  | { kind: "item"; label: string; href: string }
  | { kind: "separator" };

const Q = (base: string, view: string) => `${base}?view=${encodeURIComponent(view)}`;

export function getTopNavDropdown(navLabel: string): TopNavDropdownEntry[] | null {
  const map: Record<string, TopNavDropdownEntry[]> = {
    Clients: [
      { kind: "item", label: "F1 Pilot", href: Q("/customers", "f1-pilot") },
      { kind: "item", label: "Tennis Player", href: Q("/customers", "tennis-player") },
      { kind: "item", label: "Active clients", href: Q("/customers", "active-clients") },
      { kind: "item", label: "Inactive", href: Q("/customers", "inactive") },
      { kind: "item", label: "Pending Approval", href: Q("/customers", "pending-approval") },
      { kind: "item", label: "Set Aside", href: Q("/customers", "set-aside") },
      { kind: "item", label: "Blacklist", href: Q("/customers", "blacklist") },
      { kind: "separator" },
      { kind: "item", label: "All Clients", href: "/customers" },
    ],
    Groups: [
      { kind: "item", label: "Active Loans", href: Q("/groups", "active-loans") },
      { kind: "item", label: "Active Deposits", href: Q("/groups", "active-deposits") },
      { kind: "item", label: "Sin cuentas activas", href: Q("/groups", "sin-cuentas-activas") },
      { kind: "item", label: "Sin Miembros", href: Q("/groups", "sin-miembros") },
      { kind: "separator" },
      { kind: "item", label: "All Groups", href: "/groups" },
    ],
    Loans: [
      { kind: "item", label: "Active Loan", href: Q("/loans", "active-loan") },
      { kind: "item", label: "Pending Approval", href: Q("/loans", "pending-approval") },
      { kind: "item", label: "Pendiente de Desembolso", href: Q("/loans", "pendiente-desembolso") },
      { kind: "item", label: "En Atraso", href: Q("/loans", "en-atraso") },
      { kind: "item", label: "Close", href: Q("/loans", "close") },
      { kind: "item", label: "Renegociada", href: Q("/loans", "renegociada") },
      { kind: "item", label: "Cancelada", href: Q("/loans", "cancelada") },
      { kind: "separator" },
      { kind: "item", label: "All Loan Accounts", href: "/loans" },
    ],
    Activities: [{ kind: "item", label: "All Activities", href: "/activities" }],
    Reporting: [
      { kind: "item", label: "Indicators", href: Q("/reports", "indicators") },
      { kind: "item", label: "Portfolio", href: Q("/reports", "portfolio") },
      { kind: "item", label: "Organization", href: Q("/reports", "organization") },
      { kind: "item", label: "Earnings", href: Q("/reports", "earnings") },
      { kind: "item", label: "Cashflow", href: Q("/reports", "cashflow") },
      { kind: "item", label: "Outreach", href: Q("/reports", "outreach") },
      { kind: "item", label: "Risk", href: Q("/reports", "risk") },
    ],
    Accounting: [
      { kind: "item", label: "Balance Sheet", href: Q("/accounting", "balance-sheet") },
      { kind: "item", label: "Profit & Loss", href: Q("/accounting", "profit-loss") },
      { kind: "item", label: "Trial Balance", href: Q("/accounting", "trial-balance") },
      { kind: "separator" },
      { kind: "item", label: "Journal Entries", href: Q("/accounting", "journal-entries") },
      { kind: "item", label: "Interest Accrual Breakdown", href: Q("/accounting", "interest-accrual") },
      { kind: "separator" },
      { kind: "item", label: "Chart of Accounts", href: Q("/accounting", "chart-of-accounts") },
      { kind: "item", label: "Closures", href: Q("/accounting", "closures") },
    ],
  };

  return map[navLabel] ?? null;
}
