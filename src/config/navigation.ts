export type ZelifyTopNavItem = {
  label: string;
  href: string;
  hasDropdown?: boolean;
};

export const zelifyTopNavItems: ZelifyTopNavItem[] = [
  { label: "Dashboard", href: "/" },
  { label: "Clients", href: "/customers" },
  { label: "Organizations", href: "/settings/organization" },
  { label: "Accounts", href: "/accounts" },
  { label: "Transactions", href: "/transactions" },
  { label: "Products", href: "/products", hasDropdown: true },
  { label: "Reporting", href: "/reports" },
  { label: "Administration", href: "/settings", hasDropdown: true },
];
