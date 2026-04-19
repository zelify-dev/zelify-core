export type GeneralSetupSubNavItem = {
  label: string;
  href: string;
};

/** Pestañas internas de Administración → General Setup (referencia Figma). */
export const generalSetupSubNavItems: GeneralSetupSubNavItem[] = [
  { label: "Organization Details", href: "/settings/general/organization-details" },
  { label: "Holidays", href: "/settings/general/holidays" },
  { label: "Client Types", href: "/settings/general/client-types" },
  { label: "Internal Controls", href: "/settings/general/internal-controls" },
  { label: "Labels", href: "/settings/general/labels" },
  { label: "ID Templates", href: "/settings/general/id-templates" },
  { label: "Group Roles", href: "/settings/general/group-roles" },
  { label: "Branding", href: "/settings/general/branding" },
];

export function resolveGeneralSetupSubNavLabel(
  pathname: string,
  items: GeneralSetupSubNavItem[] = generalSetupSubNavItems
): string | null {
  const prefix = "/settings/general";
  if (pathname === prefix) return items[0]?.label ?? null;
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return null;
}
