import { ViewsSettingsShell } from "@/modules/settings/components/views-settings-shell";

export default function EventStreamingSettingsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <ViewsSettingsShell>{children}</ViewsSettingsShell>;
}
