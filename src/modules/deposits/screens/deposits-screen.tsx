"use client";

import { useCallback, useMemo, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";
import { DEPOSITS_KPI, DEPOSIT_ACCOUNTS_MOCK } from "../data/deposit-accounts.mock";
import type { DepositAccountRow } from "../types/deposit-account.types";
import { DepositsBulkActionsBar } from "../components/deposits-bulk-actions-bar";
import { DepositDetailDrawer } from "../components/deposit-detail-drawer";
import { DepositsKpiRibbon } from "../components/deposits-kpi-ribbon";
import { DepositsTable } from "../components/deposits-table";
import { DepositsToolbar } from "../components/deposits-toolbar";
import { NewDepositAccountModal } from "../components/new-deposit-account-modal";

import "@/components/ui/templates/workspace-page.css";
import "./deposits-screen.css";

function matchesSearch(row: DepositAccountRow, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return (
    row.id.toLowerCase().includes(s) ||
    row.holder.name.toLowerCase().includes(s) ||
    row.holder.type.toLowerCase().includes(s)
  );
}

export function DepositsScreen() {
  const { t, locale } = useI18n();
  const [search, setSearch] = useState("");
  const [filterState, setFilterState] = useState("all");
  const [filterProduct, setFilterProduct] = useState("all");
  const [filterBranch, setFilterBranch] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [drawerRow, setDrawerRow] = useState<DepositAccountRow | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filteredRows = useMemo(() => {
    return DEPOSIT_ACCOUNTS_MOCK.filter((row) => {
      if (!matchesSearch(row, search)) return false;
      if (filterState !== "all" && row.state !== filterState) return false;
      if (filterProduct !== "all" && row.productKey !== filterProduct) return false;
      if (filterBranch !== "all" && row.branchKey !== filterBranch) return false;
      return true;
    });
  }, [search, filterState, filterProduct, filterBranch]);

  const visibleIds = useMemo(() => filteredRows.map((r) => r.id), [filteredRows]);

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
  const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

  const onToggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onToggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }, [allVisibleSelected, visibleIds]);

  const hasActiveFilters =
    search.trim().length > 0 || filterState !== "all" || filterProduct !== "all" || filterBranch !== "all";

  const clearFilters = useCallback(() => {
    setSearch("");
    setFilterState("all");
    setFilterProduct("all");
    setFilterBranch("all");
  }, []);

  const noopProto = useCallback((label: string) => {
    console.info(`[deposits prototype] ${label}`);
  }, []);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-deposits-page__inner">
          <header className="zelify-deposits-page__head">
            <div>
              <h1 className="zelify-workspace-page__title">{t("deposits.pageTitle")}</h1>
            </div>
            <AppButton type="button" tone="primary" onClick={() => setModalOpen(true)}>
              {t("deposits.newAccount")}
            </AppButton>
          </header>

          <DepositsKpiRibbon kpi={DEPOSITS_KPI} locale={locale} t={t} />

          <DepositsToolbar
            search={search}
            onSearchChange={setSearch}
            filterState={filterState}
            onFilterState={setFilterState}
            filterProduct={filterProduct}
            onFilterProduct={setFilterProduct}
            filterBranch={filterBranch}
            onFilterBranch={setFilterBranch}
            onDownload={() => noopProto("download-report")}
            onRefresh={() => noopProto("refresh")}
            t={t}
          />

          <DepositsTable
            rows={filteredRows}
            locale={locale}
            t={t}
            selectedIds={selectedIds}
            onToggleRow={onToggleRow}
            onToggleAll={onToggleAll}
            allVisibleSelected={allVisibleSelected}
            someVisibleSelected={someVisibleSelected}
            onViewDetail={(row) => setDrawerRow(row)}
            onDepositWithdraw={(row) => noopProto(`deposit-withdraw:${row.id}`)}
            onHoldFunds={(row) => noopProto(`hold:${row.id}`)}
            onChangeStatus={(row) => noopProto(`status:${row.id}`)}
            onDownloadStatement={(row) => noopProto(`statement:${row.id}`)}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>
      </div>

      <DepositsBulkActionsBar
        count={selectedIds.size}
        t={t}
        onBlock={() => noopProto("bulk-block")}
        onChangeBranch={() => noopProto("bulk-branch")}
        onExport={() => noopProto("bulk-export")}
      />

      <DepositDetailDrawer
        open={drawerRow !== null}
        row={drawerRow}
        onClose={() => setDrawerRow(null)}
        locale={locale}
        t={t}
      />

      <NewDepositAccountModal open={modalOpen} onClose={() => setModalOpen(false)} t={t} />
    </div>
  );
}
