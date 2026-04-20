"use client";

import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";

const ROLES = [
  {
    id: "r1",
    name: "Presidente",
    desc: "Representante legal del grupo",
    min: 1,
    max: 1,
  },
  {
    id: "r2",
    name: "Tesorero",
    desc: "Control de caja y aportes",
    min: 1,
    max: 2,
  },
];

export function GroupRolesScreen() {
  return (
    <div className="zelify-settings-workspace">
      <h1 className="zelify-settings-workspace__title">Group Roles</h1>

      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Nombre del Rol</th>
            <th>Descripción</th>
            <th className="is-numeric-header">Min Integrantes</th>
            <th className="is-numeric-header">Max Integrantes</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ROLES.map((row) => (
            <tr key={row.id}>
              <td>{row.name}</td>
              <td>{row.desc}</td>
              <td className="is-numeric">{row.min}</td>
              <td className="is-numeric">{row.max}</td>
              <td className="is-actions">
                <button type="button" className="zelify-icon-btn">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}

