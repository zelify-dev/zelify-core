"use client";

import { useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./branches-screen.css";

type BranchRow = {
  id: string;
  name: string;
  kind: "PHYSICAL" | "LOGICAL";
  region: string;
  clients: number;
  groups: number;
  users: number;
  accountingEnabled: boolean;
  holidayCalendar: string;
  visibilityScope: string;
  status: "ACTIVE" | "INACTIVE";
};

const BRANCHES: BranchRow[] = [
  {
    id: "BR-001",
    name: "Sucursal Norte",
    kind: "PHYSICAL",
    region: "Quito Norte",
    clients: 1240,
    groups: 185,
    users: 26,
    accountingEnabled: true,
    holidayCalendar: "Quito Local",
    visibilityScope: "Norte + Matriz",
    status: "ACTIVE",
  },
  {
    id: "BR-002",
    name: "Sucursal Sur",
    kind: "PHYSICAL",
    region: "Cuenca Sur",
    clients: 980,
    groups: 121,
    users: 18,
    accountingEnabled: true,
    holidayCalendar: "Cuenca Local",
    visibilityScope: "Sur",
    status: "ACTIVE",
  },
  {
    id: "BR-APP",
    name: "Canal App Movil",
    kind: "LOGICAL",
    region: "Digital",
    clients: 5430,
    groups: 0,
    users: 12,
    accountingEnabled: false,
    holidayCalendar: "Nacional",
    visibilityScope: "Omnicanal",
    status: "ACTIVE",
  },
];

export function BranchesScreen() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BranchRow | null>(BRANCHES[0]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return BRANCHES;
    return BRANCHES.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q) || b.region.toLowerCase().includes(q)
    );
  }, [query]);

  const summary = useMemo(() => {
    return {
      totalBranches: BRANCHES.length,
      totalClients: BRANCHES.reduce((acc, b) => acc + b.clients, 0),
      accountingBranches: BRANCHES.filter((b) => b.accountingEnabled).length,
      totalUsers: BRANCHES.reduce((acc, b) => acc + b.users, 0),
    };
  }, []);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-branches">
          <header className="zelify-branches__head">
            <div>
              <h1 className="zelify-workspace-page__title">Branches</h1>
              <p className="zelify-workspace-page__subtitle">
                Unidades organizativas para segmentacion operativa, control de acceso y contabilidad por sucursal.
              </p>
            </div>
            <AppButton type="button" tone="primary">
              Nueva Sucursal
            </AppButton>
          </header>

          <section className="zelify-branches__kpis">
            <article>
              <span>Total Branches</span>
              <strong>{summary.totalBranches}</strong>
            </article>
            <article>
              <span>Total Clients</span>
              <strong>{summary.totalClients.toLocaleString()}</strong>
            </article>
            <article>
              <span>Accounting Enabled</span>
              <strong>{summary.accountingBranches}</strong>
            </article>
            <article>
              <span>Assigned Users</span>
              <strong>{summary.totalUsers}</strong>
            </article>
          </section>

          <section className="zelify-branches__toolbar">
            <AppInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar sucursal por nombre, ID o region..."
            />
          </section>

          <section className="zelify-branches__layout">
            <div className="zelify-branches__table-wrap">
              <SettingsDataTable variant="clients">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Sucursal</th>
                    <th>Tipo</th>
                    <th>Region</th>
                    <th className="is-numeric-header">Clientes</th>
                    <th className="is-numeric-header">Grupos</th>
                    <th className="is-numeric-header">Usuarios</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelected(row)}
                      className={selected?.id === row.id ? "is-selected" : ""}
                    >
                      <td className="zelify-mono">{row.id}</td>
                      <td>{row.name}</td>
                      <td>
                        <AppBadge tone={row.kind === "PHYSICAL" ? "success" : "neutral"} size="sm">
                          {row.kind}
                        </AppBadge>
                      </td>
                      <td>{row.region}</td>
                      <td className="is-numeric">{row.clients.toLocaleString()}</td>
                      <td className="is-numeric">{row.groups.toLocaleString()}</td>
                      <td className="is-numeric">{row.users}</td>
                      <td>
                        <AppBadge tone={row.status === "ACTIVE" ? "success" : "neutral"} size="sm">
                          {row.status}
                        </AppBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </SettingsDataTable>
            </div>

            <aside className="zelify-branches__details">
              {selected ? (
                <>
                  <h3>{selected.name}</h3>
                  <p className="zelify-branches__detail-id">{selected.id}</p>
                  <ul>
                    <li>
                      <span>Scope de visibilidad</span>
                      <strong>{selected.visibilityScope}</strong>
                    </li>
                    <li>
                      <span>Calendario de feriados</span>
                      <strong>{selected.holidayCalendar}</strong>
                    </li>
                    <li>
                      <span>Contabilidad segmentada</span>
                      <strong>{selected.accountingEnabled ? "Habilitada" : "No habilitada"}</strong>
                    </li>
                    <li>
                      <span>Asignaciones</span>
                      <strong>
                        {selected.clients.toLocaleString()} clientes, {selected.groups.toLocaleString()} grupos, {selected.users} usuarios
                      </strong>
                    </li>
                  </ul>
                  <div className="zelify-branches__detail-actions">
                    <AppButton type="button" tone="neutral">
                      Gestionar Calendario
                    </AppButton>
                    <AppButton type="button" tone="primary">
                      Editar Sucursal
                    </AppButton>
                  </div>
                </>
              ) : (
                <p>Selecciona una sucursal para ver detalle.</p>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}

