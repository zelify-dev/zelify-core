"use client";

import { SectionTitle } from "@/components/ui/atoms/section-title/section-title";
import { AppText } from "@/components/ui/atoms/text/app-text";

import "./admin-settings-placeholder-screen.css";

export function WebhooksSettingsTabScreen() {
  return (
    <div className="zelify-admin-settings-placeholder">
      <SectionTitle>Settings</SectionTitle>
      <AppText tone="muted">Configuración de webhooks próximamente.</AppText>
    </div>
  );
}
