"use client";

import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

import "./settings-workspace-shared.css";

const RISK_ROWS = [
  { id: "risk1", level: "Riesgo Bajo", minScore: 80, maxScore: 100, tone: "is-low" },
  { id: "risk2", level: "Riesgo Medio", minScore: 41, maxScore: 79, tone: "is-mid" },
  { id: "risk3", level: "Riesgo Crítico", minScore: 0, maxScore: 40, tone: "is-high" },
];

export function RiskLevelsScreen() {
  return (
    <div className="zelify-settings-workspace">
      <h1 className="zelify-settings-workspace__title">Risk Levels</h1>

      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Nivel</th>
            <th className="is-numeric-header">Score Mínimo</th>
            <th className="is-numeric-header">Score Máximo</th>
            <th>Indicador Visual</th>
          </tr>
        </thead>
        <tbody>
          {RISK_ROWS.map((row) => (
            <tr key={row.id}>
              <td>{row.level}</td>
              <td className="is-numeric">{row.minScore}</td>
              <td className="is-numeric">{row.maxScore}</td>
              <td>
                <span className={`zelify-risk-pill ${row.tone}`}>{row.level}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>
    </div>
  );
}

