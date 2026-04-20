"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./groups-list-screen.css";

type GroupRow = {
  id: string;
  name: string;
  officer: string;
  date: string;
  members: number;
  state: "ACTIVE" | "INACTIVE";
  branch: string;
  totalSavings: number;
  activeAccounts: number;
  memberBalances: { name: string; balance: number }[];
};

const GROUPS: GroupRow[] = [
  {
    id: "GRP-992",
    name: "Mujeres Emprendedoras Centro",
    officer: "Laura Gómez",
    date: "2025-11-10",
    members: 15,
    state: "ACTIVE",
    branch: "Matriz",
    totalSavings: 120400,
    activeAccounts: 15,
    memberBalances: [
      { name: "María Vera", balance: 12000 },
      { name: "Ana Solís", balance: 9800 },
      { name: "Resto de miembros", balance: 98600 },
    ],
  },
];

const money = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export function GroupsListScreen() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isActiveDeposits = view === "active-deposits";

  const [query, setQuery] = useState("");
  const [officer, setOfficer] = useState("all");
  const [drawer, setDrawer] = useState<GroupRow | null>(null);

  const filtered = useMemo(() => {
    return GROUPS.filter((g) => {
      if (officer !== "all" && g.officer !== officer) return false;
      if (query.trim() && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [query, officer]);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">
            {isActiveDeposits ? "Active Deposits - Groups" : "All Groups"}
          </h1>

          {!isActiveDeposits ? (
            <div className="zelify-groups-toolbar">
              <AppInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre de grupo"
              />
              <select className="zelify-groups-toolbar__select" value={officer} onChange={(e) => setOfficer(e.target.value)}>
                <option value="all">Todos los oficiales</option>
                <option value="Laura Gómez">Laura Gómez</option>
              </select>
            </div>
          ) : null}

          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>{isActiveDeposits ? "ID Grupo" : "ID"}</th>
                <th>Nombre</th>
                {isActiveDeposits ? <th>Sucursal</th> : <th>Oficial Asignado</th>}
                {isActiveDeposits ? (
                  <th className="is-numeric-header">Total Ahorrado</th>
                ) : (
                  <th>Fecha Creación</th>
                )}
                {isActiveDeposits ? (
                  <th className="is-numeric-header">Cuentas Activas</th>
                ) : (
                  <th className="is-numeric-header">Miembros</th>
                )}
                {!isActiveDeposits ? <th>Estado</th> : null}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} onClick={() => isActiveDeposits && setDrawer(row)}>
                  <td className="zelify-mono">{row.id}</td>
                  <td>{row.name}</td>
                  <td>{isActiveDeposits ? row.branch : row.officer}</td>
                  <td className={isActiveDeposits ? "is-numeric" : ""}>
                    {isActiveDeposits ? money(row.totalSavings) : row.date}
                  </td>
                  <td className="is-numeric">{isActiveDeposits ? row.activeAccounts : row.members}</td>
                  {!isActiveDeposits ? (
                    <td>
                      <AppBadge tone={row.state === "ACTIVE" ? "success" : "neutral"} size="sm">
                        {row.state}
                      </AppBadge>
                    </td>
                  ) : null}
                  <td className="is-actions">
                    <AppButton type="button" tone="neutral" onClick={() => setDrawer(row)}>
                      Ver Detalles
                    </AppButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </div>

      {drawer ? (
        <>
          <div className="zelify-groups-drawer-backdrop" onMouseDown={() => setDrawer(null)} />
          <aside className="zelify-groups-drawer">
            <h3>{drawer.name}</h3>
            <p>Total Ahorrado: {money(drawer.totalSavings)}</p>
            <ul>
              {drawer.memberBalances.map((member) => (
                <li key={member.name}>
                  <span>{member.name}</span>
                  <strong>{money(member.balance)}</strong>
                </li>
              ))}
            </ul>
          </aside>
        </>
      ) : null}
    </div>
  );
}
