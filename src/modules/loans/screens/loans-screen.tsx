"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./loans-screen.css";

const PENDING = [
  {
    id: "LOA-1029",
    client: "Empresa ABC",
    amount: 25000,
    approvedDate: "2026-04-18",
    destination: "DEP-5511",
  },
  {
    id: "LOA-1102",
    client: "Comercial Delta",
    amount: 18200,
    approvedDate: "2026-04-19",
    destination: "DEP-6112",
  },
];

const RENEGOTIATED = [
  {
    id: "LOA-2020",
    client: "Taller Norte",
    state: "RESTRUCTURED",
    oldRate: "18.5%",
    newRate: "15.0%",
    date: "2026-03-28",
  },
];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function LoansScreen() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isPending = view === "pendiente-desembolso";
  const isRenegotiated = view === "renegociada";
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const rows = useMemo(() => (isPending ? PENDING : isRenegotiated ? RENEGOTIATED : []), [isPending, isRenegotiated]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">
            {isPending ? "Pending Disbursement" : isRenegotiated ? "Renegotiated Loans" : "Loans"}
          </h1>

          {isPending ? (
            <SettingsDataTable variant="clients">
              <thead>
                <tr>
                  <th />
                  <th>ID Préstamo</th>
                  <th>Cliente</th>
                  <th className="is-numeric-header">Monto a Desembolsar</th>
                  <th>Fecha Aprobación</th>
                  <th>Cuenta Destino</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {PENDING.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggle(row.id)} />
                    </td>
                    <td className="zelify-mono">{row.id}</td>
                    <td>{row.client}</td>
                    <td className="is-numeric">{money(row.amount)}</td>
                    <td>{row.approvedDate}</td>
                    <td className="zelify-mono">{row.destination}</td>
                    <td className="is-actions">
                      <AppButton type="button" tone="primary">
                        Desembolsar
                      </AppButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </SettingsDataTable>
          ) : null}

          {isRenegotiated ? (
            <SettingsDataTable variant="clients">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Tasa Anterior vs Nueva</th>
                  <th>Fecha Reestructuración</th>
                </tr>
              </thead>
              <tbody>
                {RENEGOTIATED.map((row) => (
                  <tr key={row.id}>
                    <td className="zelify-mono">{row.id}</td>
                    <td>{row.client}</td>
                    <td>
                      <AppBadge tone="warning" size="sm">
                        {row.state}
                      </AppBadge>
                    </td>
                    <td>
                      <span className="zelify-loans-rate-compare">
                        <span>{row.oldRate}</span>
                        <span>→</span>
                        <strong>{row.newRate}</strong>
                      </span>
                    </td>
                    <td>{row.date}</td>
                  </tr>
                ))}
              </tbody>
            </SettingsDataTable>
          ) : null}
        </div>
      </div>

      {isPending && selected.size > 0 ? (
        <div className="zelify-loans-bulk">
          <span>{selected.size} préstamos seleccionados</span>
          <AppButton type="button" tone="primary">
            Ejecutar Desembolsos
          </AppButton>
        </div>
      ) : null}
    </div>
  );
}

