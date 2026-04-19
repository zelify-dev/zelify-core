import { ProductsSettingsShell } from "@/modules/settings/components/products-settings-shell";

export default function ProductsSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ProductsSettingsShell>{children}</ProductsSettingsShell>;
}
