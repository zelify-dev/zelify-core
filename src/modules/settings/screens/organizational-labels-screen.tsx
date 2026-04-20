"use client";

import { useMemo, useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";
import "./organizational-labels-screen.css";

type LabelRow = {
  id: string;
  key: string;
  context: string;
  valueEs: string;
  updatedAt: string;
};

const SEED: LabelRow[] = [
  {
    id: "1",
    key: "email.welcome.subject",
    context: "Correo de bienvenida",
    valueEs: "Bienvenido a {institutionName}",
    updatedAt: "2026-04-12",
  },
  {
    id: "2",
    key: "statement.footer",
    context: "Pie de extracto PDF",
    valueEs: "Depósitos asegurados según política institucional.",
    updatedAt: "2026-04-02",
  },
  {
    id: "3",
    key: "sms.otp.prefix",
    context: "SMS OTP",
    valueEs: "Tu código Zelify es:",
    updatedAt: "2026-03-28",
  },
  {
    id: "4",
    key: "portal.maintenance.banner",
    context: "Banner mantenimiento",
    valueEs: "El 21/04/2026 el portal estará en mantenimiento de 02:00 a 04:00 UTC.",
    updatedAt: "2026-04-18",
  },
];

export function OrganizationalLabelsScreen() {
  const [rows, setRows] = useState<LabelRow[]>(SEED);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) => r.key.toLowerCase().includes(s) || r.context.toLowerCase().includes(s));
  }, [rows, q]);

  return (
    <div className="zelify-settings-workspace zelify-org-labels">
      <div className="zelify-org-labels__head">
        <h1 className="zelify-settings-workspace__title">Etiquetas de sistema</h1>
        <span className="zelify-org-labels__chip">Demostración</span>
      </div>
      <p className="zelify-org-labels__lead">
        Textos reutilizables en correos, SMS y portales. Los placeholders como {"{institutionName}"} se sustituyen en tiempo de envío.
      </p>

      <div className="zelify-org-labels__toolbar">
        <AppInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por clave o contexto…" />
        <AppButton type="button" tone="primary">
          Nueva etiqueta
        </AppButton>
      </div>

      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Clave</th>
            <th>Contexto</th>
            <th>Valor (ES)</th>
            <th>Actualizado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((row) => (
            <tr key={row.id}>
              <td className="zelify-mono">{row.key}</td>
              <td>{row.context}</td>
              <td className="zelify-org-labels__value">{row.valueEs}</td>
              <td>{row.updatedAt}</td>
              <td className="is-actions">
                <button type="button" className="zelify-icon-btn">
                  Editar
                </button>
                <button
                  type="button"
                  className="zelify-icon-btn"
                  onClick={() => setRows((prev) => prev.filter((r) => r.id !== row.id))}
                >
                  Quitar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
      {filtered.length === 0 ? (
        <p className="zelify-org-labels__empty">No hay coincidencias. Limpia el buscador o crea una etiqueta nueva.</p>
      ) : null}
    </div>
  );
}
