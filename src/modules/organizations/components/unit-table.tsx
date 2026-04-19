"use client";

import React from "react";
import { ChevronLeft, ChevronRight, GripVertical, MoreHorizontal } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { OrganizationUnit, UnitState } from "../types/organization.types";

import "./unit-table.css";

interface UnitTableProps {
  units: OrganizationUnit[];
  type: "Branch" | "Centre";
}

export const UnitTable: React.FC<UnitTableProps> = ({ units, type }) => {
  const colCount = 7;

  return (
    <div className="zelify-unit-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Name</th>
            <th>ID</th>
            <th>State</th>
            <th>Address</th>
            <th>Created</th>
            <th className="is-numeric-header">Last modified</th>
            <th className="zelify-settings-data-table__actions-col" aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {units.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="zelify-unit-table__empty">
                No {type.toLowerCase()}s found.
              </td>
            </tr>
          ) : (
            units.map((unit) => (
              <tr key={unit.id}>
                <td>
                  <span className="zelify-unit-table__name-cell">
                    <GripVertical size={16} className="zelify-unit-table__grip" aria-hidden />
                    <button type="button" className="zelify-unit-table__name-btn">
                      {unit.name}
                    </button>
                  </span>
                </td>
                <td>
                  <span className="zelify-mono">{unit.id}</span>
                </td>
                <td>
                  <AppBadge tone={unitStateToTone(unit.state)} size="sm">
                    {formatUnitStateLabel(unit.state)}
                  </AppBadge>
                </td>
                <td>{unit.address}</td>
                <td>{unit.created}</td>
                <td className="is-numeric">{unit.lastModified}</td>
                <td className="is-actions">
                  <AppIconButton ariaLabel={`More actions for ${unit.name}`}>
                    <MoreHorizontal size={18} strokeWidth={2} />
                  </AppIconButton>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </SettingsDataTable>

      <div className="zelify-data-table-footer">
        <div className="zelify-data-table-footer__page-size">
          <span className="zelify-data-table-footer__info">Show</span>
          <span className="zelify-data-table-footer__page-size-value">10</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">Total: {units.length}</span>
          <div className="zelify-data-table-footer__pages">
            <button type="button" className="zelify-pagination-btn" disabled aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button type="button" className="zelify-pagination-btn" disabled aria-label="Next page">
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function formatUnitStateLabel(state: UnitState): string {
  return state.charAt(0) + state.slice(1).toLowerCase();
}

function unitStateToTone(state: UnitState): "success" | "error" | "warning" | "neutral" {
  switch (state) {
    case UnitState.ACTIVE:
      return "success";
    case UnitState.INACTIVE:
      return "warning";
    case UnitState.DEACTIVATED:
      return "neutral";
    default:
      return "neutral";
  }
}
