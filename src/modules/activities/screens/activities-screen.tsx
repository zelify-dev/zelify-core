"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Home, LayoutList } from "lucide-react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { FieldLabel } from "@/components/ui/atoms/field-label/field-label";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { getSystemActivitiesSlice, SYSTEM_ACTIVITIES_TOTAL } from "../data/system-activities.mock";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/templates/workspace-page.css";
import "@/components/ui/organisms/settings-data-table/settings-data-table.css";
import "./activities-screen.css";

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function ActivitiesScreen() {
  const { t } = useI18n();
  const [branch, setBranch] = useState("all");
  const [filter, setFilter] = useState("none");
  const [pageSize, setPageSize] = useState(50);
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(SYSTEM_ACTIVITIES_TOTAL / pageSize));

  const rows = useMemo(
    () => getSystemActivitiesSlice(page, pageSize),
    [page, pageSize]
  );

  const rangeStart = SYSTEM_ACTIVITIES_TOTAL === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, SYSTEM_ACTIVITIES_TOTAL);

  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-activities">
          <div className="zelify-activities__head">
            <div className="zelify-activities__title-block">
              <h1 className="zelify-workspace-page__title zelify-activities__title">
                {t("activities.title")}
                <button
                  type="button"
                  className="zelify-activities__title-help"
                  aria-label={t("activities.helpAria")}
                  title={t("activities.title")}
                >
                  <CircleHelp size={18} strokeWidth={1.75} aria-hidden />
                </button>
              </h1>
            </div>
            <div className="zelify-activities__head-actions">
              <AppButton type="button" tone="primary" className="zelify-activities__columns-btn">
                {t("activities.customColumns")}
                <ChevronDown size={16} strokeWidth={2} aria-hidden />
              </AppButton>
              <AppIconButton ariaLabel={t("activities.viewColumnsAria")} className="zelify-activities__settings-icon">
                <LayoutList size={20} strokeWidth={1.75} />
              </AppIconButton>
            </div>
          </div>

          <div className="zelify-activities__filters">
            <div className="zelify-activities__filter-field">
              <FieldLabel htmlFor="activities-branch">{t("activities.branch")}</FieldLabel>
              <div className="zelify-activities__branch-wrap">
                <AppSelect
                  id="activities-branch"
                  size="md"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="zelify-activities__branch-select"
                >
                  <option value="all">{t("activities.allBranches")}</option>
                  <option value="main">{t("activities.mainBranch")}</option>
                </AppSelect>
                <Home className="zelify-activities__branch-home" size={16} strokeWidth={2} aria-hidden />
              </div>
            </div>

            <div className="zelify-activities__filter-field">
              <FieldLabel htmlFor="activities-filter">{t("activities.filter")}</FieldLabel>
              <AppSelect
                id="activities-filter"
                size="md"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="zelify-activities__filter-select"
              >
                <option value="none">{t("activities.noFilter")}</option>
                <option value="user">{t("activities.byUser")}</option>
                <option value="action">{t("activities.byAction")}</option>
              </AppSelect>
            </div>

            <div className="zelify-activities__filter-submit">
              <AppButton type="button" tone="neutral" className="zelify-activities__get-btn">
                {t("activities.getTransactions")}
              </AppButton>
            </div>

            <div className="zelify-activities__filters-spacer" />

            <button type="button" className="zelify-activities__edit-columns">
              {t("activities.editColumns")}
            </button>
          </div>

          <div className="zelify-activities__table-toolbar">
            <div className="zelify-activities__page-size">
              <span className="zelify-activities__page-size-label">{t("activities.show")}</span>
              <AppSelect
                aria-label={t("activities.rowsPerPageAria")}
                size="md"
                value={String(pageSize)}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="zelify-activities__page-size-select"
              >
                {PAGE_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </AppSelect>
            </div>
            <div className="zelify-activities__pagination">
              <span className="zelify-activities__range">
                {t("activities.range")
                  .replace("{start}", String(rangeStart))
                  .replace("{end}", String(rangeEnd))
                  .replace("{total}", String(SYSTEM_ACTIVITIES_TOTAL))}
              </span>
              <div className="zelify-data-table-footer__pages">
                <button
                  type="button"
                  className="zelify-pagination-btn"
                  disabled={page <= 1}
                  aria-label={t("activities.prevPageAria")}
                  onClick={goPrev}
                >
                  <ChevronLeft size={16} strokeWidth={2} />
                </button>
                <button
                  type="button"
                  className="zelify-pagination-btn"
                  disabled={page >= totalPages}
                  aria-label={t("activities.nextPageAria")}
                  onClick={goNext}
                >
                  <ChevronRight size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="zelify-activities__table-wrap">
            <SettingsDataTable variant="clients" className="zelify-activities__data-table">
              <thead>
                <tr>
                  <th className="zelify-activities__th zelify-activities__th--accent">{t("activities.columns.creationDate")}</th>
                  <th className="zelify-activities__th zelify-activities__th--accent">{t("activities.columns.user")}</th>
                  <th className="zelify-activities__th zelify-activities__th--accent">{t("activities.columns.action")}</th>
                  <th className="zelify-activities__th zelify-activities__th--muted">{t("activities.columns.affectedItemName")}</th>
                  <th className="zelify-activities__th zelify-activities__th--muted">{t("activities.columns.affectedItemId")}</th>
                  <th className="zelify-activities__th zelify-activities__th--muted">{t("activities.columns.affectedClientName")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.creationDate}</td>
                    <td>
                      <Link href="#" className="zelify-activities__cell-link" onClick={(e) => e.preventDefault()}>
                        {t(`activities.mock.users.${row.userKey}`)}
                      </Link>
                    </td>
                    <td>
                      <span className="zelify-activities__action">{t(`activities.mock.actions.${row.actionKey}`)}</span>
                    </td>
                    <td>
                      <Link href="#" className="zelify-activities__cell-link" onClick={(e) => e.preventDefault()}>
                        {t(`activities.mock.items.${row.itemKey}`)}
                      </Link>
                    </td>
                    <td className="zelify-activities__cell-mono">{row.affectedItemId}</td>
                    <td>
                      {row.clientKey === "none" ? (
                        <span className="zelify-activities__cell-dash">{t("activities.mock.noClient")}</span>
                      ) : (
                        <Link href="#" className="zelify-activities__cell-link" onClick={(e) => e.preventDefault()}>
                          {t(`activities.mock.clients.${row.clientKey}`)}
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </SettingsDataTable>
          </div>
        </div>
      </div>
    </div>
  );
}
