export type WebhooksSetupSubNavItem = {
  label: string;
  href: string;
};

/** Pestañas de Administración → Webhooks (referencia Figma). */
export const webhooksSetupSubNavItems: WebhooksSetupSubNavItem[] = [
  { label: "Notifications", href: "/settings/webhooks" },
  { label: "Settings", href: "/settings/webhooks/settings" },
];

export function resolveWebhooksSetupSubNavLabel(
  pathname: string,
  items: WebhooksSetupSubNavItem[] = webhooksSetupSubNavItems
): string | null {
  const prefix = "/settings/webhooks";
  if (pathname === prefix) return "Notifications";
  if (!pathname.startsWith(`${prefix}/`)) return null;
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
  for (const item of sorted) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return item.label;
    }
  }
  return "Notifications";
}
