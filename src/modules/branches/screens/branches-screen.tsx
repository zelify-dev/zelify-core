"use client";

import { useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";

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
  const { t, locale } = useI18n();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BranchRow | null>(BRANCHES[0]);
  const nLocale = locale === "es" ? "es-EC" : "en-US";

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
              <h1 className="zelify-workspace-page__title">{t("branches.title")}</h1>
              <p className="zelify-workspace-page__subtitle">{t("branches.subtitle")}</p>
            </div>
            <AppButton type="button" tone="primary">
              {t("branches.newBranch")}
            </AppButton>
          </header>

          <section className="zelify-branches__kpis">
            <article>
              <span>{t("branches.kpis.totalBranches")}</span>
              <strong>{summary.totalBranches}</strong>
            </article>
            <article>
              <span>{t("branches.kpis.totalClients")}</span>
              <strong>{summary.totalClients.toLocaleString(nLocale)}</strong>
            </article>
            <article>
              <span>{t("branches.kpis.accountingEnabled")}</span>
              <strong>{summary.accountingBranches}</strong>
            </article>
            <article>
              <span>{t("branches.kpis.assignedUsers")}</span>
              <strong>{summary.totalUsers}</strong>
            </article>
          </section>

          <section className="zelify-branches__toolbar">
            <AppInput
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("branches.searchPlaceholder")}
            />
          </section>

          <section className="zelify-branches__layout">
            <div className="zelify-branches__table-wrap">
              <SettingsDataTable variant="clients">
                <thead>
                  <tr>
                    <th>{t("branches.table.id")}</th>
                    <th>{t("branches.table.name")}</th>
                    <th>{t("branches.table.type")}</th>
                    <th>{t("branches.table.region")}</th>
                    <th className="is-numeric-header">{t("branches.table.clients")}</th>
                    <th className="is-numeric-header">{t("branches.table.groups")}</th>
                    <th className="is-numeric-header">{t("branches.table.users")}</th>
                    <th>{t("branches.table.status")}</th>
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
                          {t(`branches.kind.${row.kind}`)}
                        </AppBadge>
                      </td>
                      <td>{row.region}</td>
                      <td className="is-numeric">{row.clients.toLocaleString(nLocale)}</td>
                      <td className="is-numeric">{row.groups.toLocaleString(nLocale)}</td>
                      <td className="is-numeric">{row.users}</td>
                      <td>
                        <AppBadge tone={row.status === "ACTIVE" ? "success" : "neutral"} size="sm">
                          {t(`branches.status.${row.status}`)}
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
                      <span>{t("branches.detail.visibilityScope")}</span>
                      <strong>{selected.visibilityScope}</strong>
                    </li>
                    <li>
                      <span>{t("branches.detail.holidayCalendar")}</span>
                      <strong>{selected.holidayCalendar}</strong>
                    </li>
                    <li>
                      <span>{t("branches.detail.segmentedAccounting")}</span>
                      <strong>
                        {selected.accountingEnabled
                          ? t("branches.detail.accountingYes")
                          : t("branches.detail.accountingNo")}
                      </strong>
                    </li>
                    <li>
                      <span>{t("branches.detail.assignments")}</span>
                      <strong>
                        {t("branches.assignmentsSummary")
                          .replace("{clients}", selected.clients.toLocaleString(nLocale))
                          .replace("{groups}", selected.groups.toLocaleString(nLocale))
                          .replace("{users}", String(selected.users))}
                      </strong>
                    </li>
                  </ul>
                  <div className="zelify-branches__detail-actions">
                    <AppButton type="button" tone="neutral">
                      {t("branches.detail.manageCalendar")}
                    </AppButton>
                    <AppButton type="button" tone="primary">
                      {t("branches.detail.editBranch")}
                    </AppButton>
                  </div>
                </>
              ) : (
                <p>{t("branches.emptySelect")}</p>
              )}
            </aside>
          </section>
        </div>
      </div>
    </div>
  );
}

