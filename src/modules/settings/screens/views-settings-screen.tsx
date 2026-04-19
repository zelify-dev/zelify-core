"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, PlusCircle, Star } from "lucide-react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { CreateMenuItemModal } from "@/modules/settings/components/create-menu-item-modal/create-menu-item-modal";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { mockAdminViews, PARENT_MENU_OPTIONS } from "../data/admin-views.mock";
import type { AdminViewParentMenu } from "../types/admin-view.types";

import "./views-settings-screen.css";

export function ViewsSettingsScreen() {
  const [parentMenu, setParentMenu] = useState<AdminViewParentMenu>("clients");
  const [createOpen, setCreateOpen] = useState(false);

  const rows = useMemo(
    () => mockAdminViews.filter((v) => v.parentMenu === parentMenu),
    [parentMenu]
  );

  return (
    <div className="zelify-views-settings">
      <div className="zelify-views-settings__toolbar">
        <div className="zelify-views-settings__parent-field">
          <FieldLabel htmlFor="views-parent-menu">Parent menu</FieldLabel>
          <AppSelect
            id="views-parent-menu"
            size="md"
            value={parentMenu}
            onChange={(e) => setParentMenu(e.target.value as AdminViewParentMenu)}
          >
            {PARENT_MENU_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </AppSelect>
        </div>

        <div className="zelify-views-settings__toolbar-icons" aria-label="View actions">
          <AppIconButton ariaLabel="List view" type="button">
            <List size={20} strokeWidth={1.75} />
          </AppIconButton>
          <AppIconButton ariaLabel="Grid view" type="button">
            <LayoutGrid size={20} strokeWidth={1.75} />
          </AppIconButton>
          <AppIconButton ariaLabel="Create new view" type="button" onClick={() => setCreateOpen(true)}>
            <PlusCircle size={22} strokeWidth={1.75} />
          </AppIconButton>
        </div>
      </div>

      <div className="zelify-views-settings__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-views-settings__data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Filter</th>
              <th>Owner</th>
              <th className="zelify-settings-data-table__actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="zelify-views-settings__name-cell">
                    {row.isFavorite ? (
                      <Star
                        size={16}
                        className="zelify-views-settings__star is-favorite"
                        aria-label="Favorite"
                        fill="currentColor"
                      />
                    ) : (
                      <Star size={16} className="zelify-views-settings__star" aria-hidden />
                    )}
                    <Link href="#" className="zelify-views-settings__name-link" onClick={(e) => e.preventDefault()}>
                      {row.name}
                    </Link>
                  </span>
                </td>
                <td>{row.filter}</td>
                <td className="zelify-views-settings__owner">{row.owner === "you" ? "You" : "Mambu"}</td>
                <td className="is-actions">
                  <FinancialTableRowActions rowLabel={row.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </div>

      <div className="zelify-views-settings__footer-actions">
        <AppButton type="button" tone="secondary">
          Rearrange views
        </AppButton>
        <AppButton type="button" tone="primary" onClick={() => setCreateOpen(true)}>
          Create new view
        </AppButton>
      </div>

      <CreateMenuItemModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
