"use client";

import { useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "@/components/ui/templates/workspace-page.css";
import "./settings-workspace-shared.css";
import "./access-settings-screen.css";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  branches: string;
  mfa: boolean;
  status: "active" | "invited" | "locked";
};

const USERS: UserRow[] = [
  { id: "u1", name: "Juan Carlos", email: "jc@zelify.demo", role: "Admin", branches: "Todas", mfa: true, status: "active" },
  { id: "u2", name: "Andrea Molina", email: "a.molina@zelify.demo", role: "Oficial crédito", branches: "Norte, Matriz", mfa: false, status: "active" },
  { id: "u3", name: "Marco Ruiz", email: "m.ruiz@zelify.demo", role: "Cajero", branches: "Sur", mfa: true, status: "invited" },
  { id: "u4", name: "Sofía Valenzuela", email: "s.valenzuela@zelify.demo", role: "Auditor", branches: "Matriz", mfa: true, status: "locked" },
];

function statusTone(s: UserRow["status"]) {
  if (s === "active") return "success";
  if (s === "invited") return "warning";
  return "error";
}

function statusLabel(s: UserRow["status"]) {
  if (s === "active") return "Activo";
  if (s === "invited") return "Invitado";
  return "Bloqueado";
}

export function AccessSettingsScreen() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return USERS;
    return USERS.filter((u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
  }, [q]);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-access-settings">
          <header className="zelify-access-settings__head">
            <div>
              <h1 className="zelify-workspace-page__title">Acceso y usuarios</h1>
              <p className="zelify-access-settings__sub">Gestión de cuentas internas (demostración).</p>
            </div>
            <AppButton type="button" tone="primary">
              Invitar usuario
            </AppButton>
          </header>

          <div className="zelify-access-settings__toolbar">
            <AppInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o correo…" />
          </div>

          <SettingsDataTable variant="clients">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Correo</th>
                <th>Rol</th>
                <th>Sucursales</th>
                <th>MFA</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{row.email}</td>
                  <td>{row.role}</td>
                  <td>{row.branches}</td>
                  <td>{row.mfa ? "Sí" : "No"}</td>
                  <td>
                    <AppBadge tone={statusTone(row.status)} size="sm">
                      {statusLabel(row.status)}
                    </AppBadge>
                  </td>
                  <td className="is-actions">
                    <button type="button" className="zelify-access-settings__link">
                      Editar
                    </button>
                    <button type="button" className="zelify-access-settings__link">
                      Permisos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </SettingsDataTable>
        </div>
      </div>
    </div>
  );
}
