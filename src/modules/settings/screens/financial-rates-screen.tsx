"use client";

import { useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./financial-rates-screen.css";

type RateRow = {
  id: string;
  code: string;
  name: string;
  valuePercent: string;
  effectiveOn: string;
  source: string;
  status: "active" | "stale";
};

const SEED: RateRow[] = [
  { id: "1", code: "SOFR_ON", name: "SOFR overnight", valuePercent: "5.32", effectiveOn: "2026-04-18", source: "NY Fed", status: "active" },
  { id: "2", code: "PRIME_US", name: "US Prime (referencia)", valuePercent: "8.50", effectiveOn: "2026-04-17", source: "Manual", status: "active" },
  { id: "3", code: "FED_FUNDS", name: "Fed funds target (techo)", valuePercent: "5.50", effectiveOn: "2026-04-01", source: "FRED", status: "stale" },
];

export function FinancialRatesScreen() {
  const [rows] = useState(SEED);
  const [note, setNote] = useState("");

  return (
    <div className="zelify-settings-workspace zelify-fin-rates">
      <h1 className="zelify-settings-workspace__title">Tasas de referencia</h1>
      <p className="zelify-fin-rates__lead">
        Tasas usadas en índices y spreads de productos (datos de demostración). La institución puede fijar valores manuales o importar feeds.
      </p>

      <section className="zelify-policy-card zelify-fin-rates__manual">
        <h2>Actualización manual rápida</h2>
        <div className="zelify-fin-rates__manual-grid">
          <label>
            Código
            <select defaultValue="SOFR_ON">
              <option value="SOFR_ON">SOFR_ON</option>
              <option value="PRIME_US">PRIME_US</option>
            </select>
          </label>
          <label>
            Valor (%)
            <AppInput type="number" step="0.01" placeholder="5.32" />
          </label>
          <label>
            Vigente desde
            <AppInput type="date" />
          </label>
        </div>
        <label className="zelify-fin-rates__note">
          Nota de auditoría
          <AppInput value={note} onChange={(e) => setNote(e.target.value)} placeholder="Opcional: motivo del cambio" />
        </label>
        <AppButton type="button" tone="primary">
          Registrar tasa
        </AppButton>
      </section>

      <h2 className="zelify-settings-workspace__subtitle">Historial reciente</h2>
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th className="is-numeric-header">Valor %</th>
            <th>Vigente desde</th>
            <th>Origen</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="zelify-mono">{row.code}</td>
              <td>{row.name}</td>
              <td className="is-numeric">{row.valuePercent}</td>
              <td>{row.effectiveOn}</td>
              <td>{row.source}</td>
              <td>
                <AppBadge tone={row.status === "active" ? "success" : "warning"} size="sm">
                  {row.status === "active" ? "Vigente" : "Revisar"}
                </AppBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}
