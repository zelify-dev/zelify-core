"use client";

import { useState } from "react";

import "./client-types-screen.css";

type ClientTypeRow = {
  id: string;
  name: string;
  created: string;
  createdBy: string;
  isDefault?: boolean;
};

const MOCK_ROWS: ClientTypeRow[] = [
  { id: "1", name: "Cliente", created: "21-05-2025", createdBy: "Mambu", isDefault: true },
  { id: "2", name: "Tennis Player", created: "02-06-2025", createdBy: "Valerio Ferrari" },
  { id: "3", name: "F1 Pilot", created: "28-05-2025", createdBy: "Valerio Ferrari" },
];

export function ClientTypesScreen() {
  const [typeFilter, setTypeFilter] = useState("client");

  return (
    <div className="zelify-client-types">
      <div className="zelify-client-types__main">
        <div className="zelify-client-types__toolbar">
          <label className="zelify-client-types__field">
            <span className="zelify-client-types__field-label">Type</span>
            <select
              className="zelify-client-types__select"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by type"
            >
              <option value="client">Client</option>
              <option value="group">Group</option>
            </select>
          </label>
        </div>

        <div className="zelify-client-types__table-wrap">
          <table className="zelify-client-types__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Created By</th>
                <th className="zelify-client-types__col-actions" />
              </tr>
            </thead>
            <tbody>
              {MOCK_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="zelify-client-types__name">
                      {row.name}
                      {row.isDefault ? (
                        <span className="zelify-client-types__default-badge">DEFAULT</span>
                      ) : null}
                    </span>
                  </td>
                  <td>{row.created}</td>
                  <td>{row.createdBy}</td>
                  <td className="zelify-client-types__col-actions">
                    <button type="button" className="zelify-client-types__actions-btn">
                      Actions
                      <ChevronDownSmall />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="zelify-client-types__footer-actions">
          <button type="button" className="zelify-client-types__btn zelify-client-types__btn--muted">
            Rearrange
          </button>
          <button type="button" className="zelify-client-types__btn zelify-client-types__btn--primary">
            Add Type
          </button>
        </div>
      </div>
    </div>
  );
}

function ChevronDownSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
