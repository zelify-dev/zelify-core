"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { useI18n } from "@/providers/i18n-provider";
import type { Product, ProductFormInput, ProductKind } from "../types/product.types";
import { productsService } from "../services/products.service";

import "@/components/ui/templates/workspace-page.css";
import "./products-screen.css";

type EditorState = { mode: "create" | "edit"; product: Product | null } | null;

const toneByKind = (k: ProductKind) => (k === "DEPOSIT" ? "success" : "warning");

export function ProductsScreen() {
  const { t, locale } = useI18n();
  const nLocale = locale === "es" ? "es-EC" : "en-US";

  const money = useCallback(
    (n: number) => new Intl.NumberFormat(nLocale, { style: "currency", currency: "USD" }).format(n),
    [nLocale]
  );

  const enumLabel = useCallback(
    (group: "productType" | "interestRateSettings" | "paymentMethod" | "repaymentFrequency", value: string) =>
      t(`productsScreen.enums.${group}.${value}`),
    [t]
  );

  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"ALL" | ProductKind>("ALL");
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [selected, setSelected] = useState<Product | null>(null);
  const [editor, setEditor] = useState<EditorState>(null);
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState<ProductFormInput>({
    name: "",
    kind: "DEPOSIT",
    minAmount: 0,
    maxAmount: 0,
    minInterestRate: 0,
    maxInterestRate: 0,
    productType: "SAVINGS_PLAN",
    overdraftAllowed: false,
    overdraftLimit: 0,
    interestRateSettings: "FIXED",
    paymentMethod: "EQUATED_INSTALLMENTS",
    gracePeriodInstallments: 0,
    maxInstallments: 12,
    repaymentFrequency: "MONTHLY",
    collateralRequired: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await productsService.getAllProducts();
      setRows(data);
      if (!selected && data.length) setSelected(data[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((p) => {
      if (kindFilter !== "ALL" && p.kind !== kindFilter) return false;
      if (activeFilter === "ACTIVE" && !p.active) return false;
      if (activeFilter === "INACTIVE" && p.active) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    });
  }, [rows, query, kindFilter, activeFilter]);

  const summary = useMemo(() => {
    const deposits = rows.filter((p) => p.kind === "DEPOSIT").length;
    const loans = rows.filter((p) => p.kind === "LOAN").length;
    const active = rows.filter((p) => p.active).length;
    const inactive = rows.length - active;
    return { deposits, loans, active, inactive };
  }, [rows]);

  const openCreate = (kind: ProductKind) => {
    setError("");
    setForm((prev) => ({ ...prev, name: "", kind }));
    setEditor({ mode: "create", product: null });
  };

  const openEdit = (product: Product) => {
    setError("");
    setForm({
      id: product.id,
      name: product.name,
      kind: product.kind,
      minAmount: product.minAmount,
      maxAmount: product.maxAmount,
      minInterestRate: product.minInterestRate,
      maxInterestRate: product.maxInterestRate,
      ...(product.kind === "DEPOSIT"
        ? {
            productType: product.productType,
            overdraftAllowed: product.overdraftAllowed,
            overdraftLimit: product.overdraftLimit,
            interestRateSettings: product.interestRateSettings,
          }
        : {
            paymentMethod: product.paymentMethod,
            gracePeriodInstallments: product.gracePeriodInstallments,
            maxInstallments: product.maxInstallments,
            repaymentFrequency: product.repaymentFrequency,
            collateralRequired: product.collateralRequired,
          }),
    });
    setEditor({ mode: "edit", product });
  };

  const validate = (input: ProductFormInput): string => {
    if (!input.name.trim()) return t("productsScreen.validation.nameRequired");
    if (input.minAmount < 0 || input.maxAmount <= 0 || input.maxAmount < input.minAmount) {
      return t("productsScreen.validation.amountRange");
    }
    if (input.maxInterestRate < input.minInterestRate) return t("productsScreen.validation.rateRange");
    if (input.kind === "LOAN" && (input.maxInstallments ?? 0) <= 0) return t("productsScreen.validation.maxInstallments");
    if (input.kind === "DEPOSIT" && input.overdraftAllowed && (input.overdraftLimit ?? 0) <= 0) {
      return t("productsScreen.validation.overdraftLimit");
    }
    return "";
  };

  const save = async () => {
    const validation = validate(form);
    if (validation) {
      setError(validation);
      return;
    }
    if (!editor) return;
    if (editor.mode === "create") await productsService.createProduct(form);
    if (editor.mode === "edit" && editor.product) await productsService.updateProduct(editor.product.id, form);
    setEditor(null);
    await load();
  };

  const remove = async (id: string) => {
    await productsService.deleteProduct(id);
    await load();
    if (selected?.id === id) setSelected(null);
  };

  const toggleActive = async (id: string) => {
    await productsService.toggleProductActive(id);
    await load();
  };

  const detailSubtitle =
    selected &&
    (selected.kind === "DEPOSIT"
      ? t("productsScreen.detail.subtitleDeposit").replace("{id}", selected.id)
      : t("productsScreen.detail.subtitleLoan").replace("{id}", selected.id));

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-products-crud">
          <header className="zelify-products-crud__head">
            <div>
              <h1 className="zelify-workspace-page__title">{t("productsScreen.title")}</h1>
              <p className="zelify-products-crud__meta">{t("productsScreen.subtitle")}</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AppButton type="button" tone="neutral" onClick={() => openCreate("DEPOSIT")}>
                {t("productsScreen.newDeposit")}
              </AppButton>
              <AppButton type="button" tone="primary" onClick={() => openCreate("LOAN")}>
                {t("productsScreen.newLoan")}
              </AppButton>
            </div>
          </header>

          <section className="zelify-products-crud__summary">
            <article>
              <span>{t("productsScreen.kpis.depositProducts")}</span>
              <strong>{summary.deposits}</strong>
            </article>
            <article>
              <span>{t("productsScreen.kpis.loanProducts")}</span>
              <strong>{summary.loans}</strong>
            </article>
            <article>
              <span>{t("productsScreen.kpis.active")}</span>
              <strong>{summary.active}</strong>
            </article>
            <article>
              <span>{t("productsScreen.kpis.inactive")}</span>
              <strong>{summary.inactive}</strong>
            </article>
          </section>

          <section className="zelify-products-crud__toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("productsScreen.searchPlaceholder")}
            />
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}>
              <option value="ALL">{t("productsScreen.filters.allKinds")}</option>
              <option value="DEPOSIT">{t("productsScreen.filters.deposit")}</option>
              <option value="LOAN">{t("productsScreen.filters.loan")}</option>
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
              <option value="ALL">{t("productsScreen.filters.allStates")}</option>
              <option value="ACTIVE">{t("productsScreen.filters.active")}</option>
              <option value="INACTIVE">{t("productsScreen.filters.inactive")}</option>
            </select>
            <AppButton type="button" tone="neutral" onClick={() => load()}>
              {t("productsScreen.refresh")}
            </AppButton>
          </section>

          <section className="zelify-products-crud__table-wrap">
            <SettingsDataTable variant="clients">
              <thead>
                <tr>
                  <th>{t("productsScreen.table.id")}</th>
                  <th>{t("productsScreen.table.name")}</th>
                  <th>{t("productsScreen.table.kind")}</th>
                  <th className="is-numeric-header">{t("productsScreen.table.amountRange")}</th>
                  <th className="is-numeric-header">{t("productsScreen.table.rateRange")}</th>
                  <th>{t("productsScreen.table.state")}</th>
                  <th>{t("productsScreen.table.updated")}</th>
                  <th>{t("productsScreen.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>{t("productsScreen.loading")}</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} onClick={() => setSelected(row)}>
                      <td className="zelify-mono">{row.id}</td>
                      <td>{row.name}</td>
                      <td>
                        <AppBadge tone={toneByKind(row.kind)} size="sm">
                          {t(`productsScreen.kind.${row.kind}`)}
                        </AppBadge>
                      </td>
                      <td className="is-numeric">
                        {money(row.minAmount)} — {money(row.maxAmount)}
                      </td>
                      <td className="is-numeric">
                        {row.minInterestRate}% — {row.maxInterestRate}%
                      </td>
                      <td>
                        <AppBadge tone={row.active ? "success" : "neutral"} size="sm">
                          {row.active ? t("productsScreen.state.ACTIVE") : t("productsScreen.state.INACTIVE")}
                        </AppBadge>
                      </td>
                      <td>{row.updatedAt}</td>
                      <td>
                        <div className="zelify-products-crud__ops">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
                            {t("productsScreen.rowActions.view")}
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                            {t("productsScreen.rowActions.edit")}
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); void toggleActive(row.id); }}>
                            {row.active ? t("productsScreen.rowActions.deactivate") : t("productsScreen.rowActions.activate")}
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); void remove(row.id); }}>
                            {t("productsScreen.rowActions.delete")}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </SettingsDataTable>
          </section>

          <section className="zelify-products-details">
            <h3>{selected ? selected.name : t("productsScreen.detail.emptyTitle")}</h3>
            {selected && detailSubtitle ? (
              <p className="zelify-products-details__endpoint">{detailSubtitle}</p>
            ) : null}
            {selected ? (
              <ul>
                <li>
                  {t("productsScreen.detail.amountRules")
                    .replace("{min}", money(selected.minAmount))
                    .replace("{max}", money(selected.maxAmount))}
                </li>
                <li>
                  {t("productsScreen.detail.rateRange")
                    .replace("{min}", String(selected.minInterestRate))
                    .replace("{max}", String(selected.maxInterestRate))}
                </li>
                {selected.kind === "DEPOSIT" ? (
                  <>
                    <li>
                      {t("productsScreen.detail.deposit.productType")}: {enumLabel("productType", selected.productType)}
                    </li>
                    <li>
                      {t("productsScreen.detail.deposit.interestSettings")}:{" "}
                      {enumLabel("interestRateSettings", selected.interestRateSettings)}
                    </li>
                    <li>
                      {t("productsScreen.detail.deposit.overdraft")}:{" "}
                      {selected.overdraftAllowed
                        ? t("productsScreen.detail.deposit.overdraftYes").replace("{limit}", money(selected.overdraftLimit))
                        : t("productsScreen.detail.deposit.overdraftNo")}
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      {t("productsScreen.detail.loan.paymentMethod")}: {enumLabel("paymentMethod", selected.paymentMethod)}
                    </li>
                    <li>
                      {t("productsScreen.detail.loan.grace")}:{" "}
                      {t("productsScreen.detail.loan.graceValue").replace("{n}", String(selected.gracePeriodInstallments))}
                    </li>
                    <li>
                      {t("productsScreen.detail.loan.schedule")}:{" "}
                      {t("productsScreen.detail.loan.scheduleValue")
                        .replace("{frequency}", enumLabel("repaymentFrequency", selected.repaymentFrequency))
                        .replace("{max}", String(selected.maxInstallments))}
                    </li>
                    <li>
                      {t("productsScreen.detail.loan.collateral")}:{" "}
                      {selected.collateralRequired
                        ? t("productsScreen.detail.loan.collateralYes")
                        : t("productsScreen.detail.loan.collateralNo")}
                    </li>
                  </>
                )}
              </ul>
            ) : (
              <ul>
                <li>{t("productsScreen.detail.emptyHint")}</li>
              </ul>
            )}
          </section>
        </div>
      </div>

      {editor ? (
        <div className="zelify-products-modal-backdrop" onMouseDown={() => setEditor(null)}>
          <div className="zelify-products-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{editor.mode === "create" ? t("productsScreen.modal.createTitle") : t("productsScreen.modal.editTitle")}</h2>
            <p className="zelify-products-crud__meta">
              {form.kind === "DEPOSIT" ? t("productsScreen.modal.rulesHintDeposit") : t("productsScreen.modal.rulesHintLoan")}
            </p>
            <div className="zelify-products-modal__grid">
              <label>
                {t("productsScreen.modal.name")}
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label>
                {t("productsScreen.modal.kind")}
                <select
                  value={form.kind}
                  disabled={editor.mode === "edit"}
                  onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as ProductKind }))}
                >
                  <option value="DEPOSIT">{t("productsScreen.kind.DEPOSIT")}</option>
                  <option value="LOAN">{t("productsScreen.kind.LOAN")}</option>
                </select>
              </label>
              <label>
                {t("productsScreen.modal.minAmount")}
                <input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => setForm((p) => ({ ...p, minAmount: Number(e.target.value) }))}
                />
              </label>
              <label>
                {t("productsScreen.modal.maxAmount")}
                <input
                  type="number"
                  value={form.maxAmount}
                  onChange={(e) => setForm((p) => ({ ...p, maxAmount: Number(e.target.value) }))}
                />
              </label>
              <label>
                {t("productsScreen.modal.minRate")}
                <input
                  type="number"
                  step="0.01"
                  value={form.minInterestRate}
                  onChange={(e) => setForm((p) => ({ ...p, minInterestRate: Number(e.target.value) }))}
                />
              </label>
              <label>
                {t("productsScreen.modal.maxRate")}
                <input
                  type="number"
                  step="0.01"
                  value={form.maxInterestRate}
                  onChange={(e) => setForm((p) => ({ ...p, maxInterestRate: Number(e.target.value) }))}
                />
              </label>

              {form.kind === "DEPOSIT" ? (
                <>
                  <label>
                    {t("productsScreen.modal.depositProductType")}
                    <select
                      value={form.productType}
                      onChange={(e) => setForm((p) => ({ ...p, productType: e.target.value as ProductFormInput["productType"] }))}
                    >
                      <option value="CURRENT_ACCOUNT">{enumLabel("productType", "CURRENT_ACCOUNT")}</option>
                      <option value="SAVINGS_PLAN">{enumLabel("productType", "SAVINGS_PLAN")}</option>
                      <option value="FIXED_DEPOSIT">{enumLabel("productType", "FIXED_DEPOSIT")}</option>
                    </select>
                  </label>
                  <label>
                    {t("productsScreen.modal.interestRateSettings")}
                    <select
                      value={form.interestRateSettings}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, interestRateSettings: e.target.value as ProductFormInput["interestRateSettings"] }))
                      }
                    >
                      <option value="FIXED">{enumLabel("interestRateSettings", "FIXED")}</option>
                      <option value="TIERED">{enumLabel("interestRateSettings", "TIERED")}</option>
                    </select>
                  </label>
                  <label>
                    {t("productsScreen.modal.overdraftAllowed")}
                    <select
                      value={form.overdraftAllowed ? "yes" : "no"}
                      onChange={(e) => setForm((p) => ({ ...p, overdraftAllowed: e.target.value === "yes" }))}
                    >
                      <option value="no">{t("productsScreen.modal.no")}</option>
                      <option value="yes">{t("productsScreen.modal.yes")}</option>
                    </select>
                  </label>
                  <label>
                    {t("productsScreen.modal.overdraftLimit")}
                    <input
                      type="number"
                      value={form.overdraftLimit}
                      onChange={(e) => setForm((p) => ({ ...p, overdraftLimit: Number(e.target.value) }))}
                    />
                  </label>
                </>
              ) : (
                <>
                  <label>
                    {t("productsScreen.modal.paymentMethod")}
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as ProductFormInput["paymentMethod"] }))}
                    >
                      <option value="EQUATED_INSTALLMENTS">{enumLabel("paymentMethod", "EQUATED_INSTALLMENTS")}</option>
                      <option value="DECLINING_BALANCE">{enumLabel("paymentMethod", "DECLINING_BALANCE")}</option>
                    </select>
                  </label>
                  <label>
                    {t("productsScreen.modal.repaymentFrequency")}
                    <select
                      value={form.repaymentFrequency}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, repaymentFrequency: e.target.value as ProductFormInput["repaymentFrequency"] }))
                      }
                    >
                      <option value="DAILY">{enumLabel("repaymentFrequency", "DAILY")}</option>
                      <option value="WEEKLY">{enumLabel("repaymentFrequency", "WEEKLY")}</option>
                      <option value="MONTHLY">{enumLabel("repaymentFrequency", "MONTHLY")}</option>
                    </select>
                  </label>
                  <label>
                    {t("productsScreen.modal.graceInstallments")}
                    <input
                      type="number"
                      value={form.gracePeriodInstallments}
                      onChange={(e) => setForm((p) => ({ ...p, gracePeriodInstallments: Number(e.target.value) }))}
                    />
                  </label>
                  <label>
                    {t("productsScreen.modal.maxInstallments")}
                    <input
                      type="number"
                      value={form.maxInstallments}
                      onChange={(e) => setForm((p) => ({ ...p, maxInstallments: Number(e.target.value) }))}
                    />
                  </label>
                  <label>
                    {t("productsScreen.modal.collateralRequired")}
                    <select
                      value={form.collateralRequired ? "yes" : "no"}
                      onChange={(e) => setForm((p) => ({ ...p, collateralRequired: e.target.value === "yes" }))}
                    >
                      <option value="no">{t("productsScreen.modal.no")}</option>
                      <option value="yes">{t("productsScreen.modal.yes")}</option>
                    </select>
                  </label>
                </>
              )}
            </div>
            {error ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p> : null}
            <footer className="zelify-products-modal__footer">
              <AppButton type="button" tone="neutral" onClick={() => setEditor(null)}>
                {t("productsScreen.modal.cancel")}
              </AppButton>
              <AppButton type="button" tone="primary" onClick={() => void save()}>
                {editor.mode === "create" ? t("productsScreen.modal.saveCreate") : t("productsScreen.modal.saveEdit")}
              </AppButton>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}
