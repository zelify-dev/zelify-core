"use client";

import { useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./webhooks-settings-tab-screen.css";

type HookRow = { id: string; endpoint: string; events: string; signing: "HMAC" | "none"; lastStatus: string };

const SEED: HookRow[] = [
  { id: "1", endpoint: "https://integrations.zelify.demo/hooks/core", events: "LOAN_APPROVED, DEPOSIT_CREATED", signing: "HMAC", lastStatus: "200 OK" },
  { id: "2", endpoint: "https://risk.partner.example/v1/events", events: "CLIENT_BLACKLISTED", signing: "HMAC", lastStatus: "timeout" },
];

export function WebhooksSettingsTabScreen() {
  const [rows, setRows] = useState(SEED);
  const [endpoint, setEndpoint] = useState("");
  const [secret, setSecret] = useState("");
  const [events, setEvents] = useState("LOAN_DISBURSED");

  const addRow = () => {
    if (!endpoint.trim()) return;
    setRows((prev) => [
      ...prev,
      {
        id: String(prev.length + 1),
        endpoint: endpoint.trim(),
        events: events.trim() || "*",
        signing: secret.trim() ? "HMAC" : "none",
        lastStatus: "—",
      },
    ]);
    setEndpoint("");
    setSecret("");
  };

  return (
    <div className="zelify-settings-workspace zelify-webhook-settings-tab">
      <h1 className="zelify-settings-workspace__title">Configuración de webhooks</h1>
      <p className="zelify-webhook-settings-tab__lead">
        Suscripciones salientes hacia tus integraciones. Los secretos se muestran solo al crear.
      </p>

      <section className="zelify-policy-card zelify-webhook-settings-tab__form">
        <h2>Nuevo endpoint</h2>
        <div className="zelify-webhook-settings-tab__grid">
          <label>
            URL HTTPS
            <AppInput value={endpoint} onChange={(e) => setEndpoint(e.target.value)} placeholder="https://…" />
          </label>
          <label>
            Eventos (coma separada)
            <AppInput value={events} onChange={(e) => setEvents(e.target.value)} />
          </label>
          <label>
            Secret firma (opcional)
            <AppInput type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="whsec_…" />
          </label>
        </div>
        <AppButton type="button" tone="primary" onClick={addRow}>
          Añadir webhook
        </AppButton>
      </section>

      <h2 className="zelify-settings-workspace__subtitle">Activos</h2>
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Endpoint</th>
            <th>Eventos</th>
            <th>Firma</th>
            <th>Último intento</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="zelify-webhook-settings-tab__url">{row.endpoint}</td>
              <td>{row.events}</td>
              <td>{row.signing}</td>
              <td>
                <AppBadge tone={row.lastStatus === "200 OK" ? "success" : row.lastStatus === "—" ? "neutral" : "error"} size="sm">
                  {row.lastStatus}
                </AppBadge>
              </td>
              <td className="is-actions">
                <button type="button" className="zelify-webhook-settings-tab__btn">
                  Probar
                </button>
                <button type="button" className="zelify-webhook-settings-tab__btn" onClick={() => setRows((p) => p.filter((r) => r.id !== row.id))}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}
