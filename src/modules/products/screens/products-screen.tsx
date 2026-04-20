"use client";

import { useEffect, useMemo, useState } from "react";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import type { Product, ProductFormInput, ProductKind } from "../types/product.types";
import { mockMambuEndpoints, productsService } from "../services/products.service";

import "@/components/ui/templates/workspace-page.css";
import "./products-screen.css";

type EditorState = { mode: "create" | "edit"; product: Product | null } | null;

const toneByKind = (k: ProductKind) => (k === "DEPOSIT" ? "success" : "warning");

function money(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export function ProductsScreen() {
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
    if (!input.name.trim()) return "El nombre es obligatorio.";
    if (input.minAmount < 0 || input.maxAmount <= 0 || input.maxAmount < input.minAmount) {
      return "Rango de monto invalido.";
    }
    if (input.maxInterestRate < input.minInterestRate) return "Rango de tasa invalido.";
    if (input.kind === "LOAN" && (input.maxInstallments ?? 0) <= 0) return "Maximo de cuotas invalido.";
    if (input.kind === "DEPOSIT" && input.overdraftAllowed && (input.overdraftLimit ?? 0) <= 0) {
      return "Si hay sobregiro, define limite mayor a 0.";
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

  const detailsEndpoint = selected
    ? mockMambuEndpoints.detailEndpoint(selected.kind, selected.id)
    : mockMambuEndpoints.listEndpoint("DEPOSIT");

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-products-crud">
          <header className="zelify-products-crud__head">
            <div>
              <h1 className="zelify-workspace-page__title">Products</h1>
              <p className="zelify-products-crud__meta">
                Catalogo maestro de reglas (depositproducts / loanproducts) para creacion de cuentas.
                <span className="zelify-products-crud__mock-chip">MOCK DATA</span>
              </p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <AppButton type="button" tone="neutral" onClick={() => openCreate("DEPOSIT")}>
                Nuevo Deposito
              </AppButton>
              <AppButton type="button" tone="primary" onClick={() => openCreate("LOAN")}>
                Nuevo Prestamo
              </AppButton>
            </div>
          </header>

          <section className="zelify-products-crud__summary">
            <article>
              <span>Deposit Products</span>
              <strong>{summary.deposits}</strong>
            </article>
            <article>
              <span>Loan Products</span>
              <strong>{summary.loans}</strong>
            </article>
            <article>
              <span>Active</span>
              <strong>{summary.active}</strong>
            </article>
            <article>
              <span>Inactive</span>
              <strong>{summary.inactive}</strong>
            </article>
          </section>

          <section className="zelify-products-crud__toolbar">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por ID o nombre de producto..."
            />
            <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as typeof kindFilter)}>
              <option value="ALL">Todos los tipos</option>
              <option value="DEPOSIT">Deposito</option>
              <option value="LOAN">Prestamo</option>
            </select>
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as typeof activeFilter)}>
              <option value="ALL">Todos los estados</option>
              <option value="ACTIVE">Activos</option>
              <option value="INACTIVE">Inactivos</option>
            </select>
            <AppButton type="button" tone="neutral" onClick={() => load()}>
              Refrescar
            </AppButton>
          </section>

          <section className="zelify-products-crud__table-wrap">
            <SettingsDataTable variant="clients">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Tipo</th>
                  <th className="is-numeric-header">Rango monto</th>
                  <th className="is-numeric-header">Rango tasa</th>
                  <th>Estado</th>
                  <th>Actualizado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>Cargando productos...</td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} onClick={() => setSelected(row)}>
                      <td className="zelify-mono">{row.id}</td>
                      <td>{row.name}</td>
                      <td>
                        <AppBadge tone={toneByKind(row.kind)} size="sm">
                          {row.kind}
                        </AppBadge>
                      </td>
                      <td className="is-numeric">
                        {money(row.minAmount)} - {money(row.maxAmount)}
                      </td>
                      <td className="is-numeric">
                        {row.minInterestRate}% - {row.maxInterestRate}%
                      </td>
                      <td>
                        <AppBadge tone={row.active ? "success" : "neutral"} size="sm">
                          {row.active ? "ACTIVE" : "INACTIVE"}
                        </AppBadge>
                      </td>
                      <td>{row.updatedAt}</td>
                      <td>
                        <div className="zelify-products-crud__ops">
                          <button type="button" onClick={(e) => { e.stopPropagation(); setSelected(row); }}>
                            Ver
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>
                            Editar
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); void toggleActive(row.id); }}>
                            {row.active ? "Desactivar" : "Activar"}
                          </button>
                          <button type="button" onClick={(e) => { e.stopPropagation(); void remove(row.id); }}>
                            Eliminar
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
            <h3>{selected ? selected.name : "Detalle de producto"}</h3>
            <p className="zelify-products-details__endpoint">{detailsEndpoint}</p>
            {selected ? (
              <ul>
                <li>
                  Reglas de monto: {money(selected.minAmount)} a {money(selected.maxAmount)}
                </li>
                <li>
                  Rango de tasas: {selected.minInterestRate}% a {selected.maxInterestRate}%
                </li>
                {selected.kind === "DEPOSIT" ? (
                  <>
                    <li>productType: {selected.productType}</li>
                    <li>interestRateSettings: {selected.interestRateSettings}</li>
                    <li>
                      overdraftSettings: {selected.overdraftAllowed ? `Permitido (limite ${money(selected.overdraftLimit)})` : "No permitido"}
                    </li>
                  </>
                ) : (
                  <>
                    <li>paymentMethod: {selected.paymentMethod}</li>
                    <li>gracePeriodSettings: {selected.gracePeriodInstallments} cuotas</li>
                    <li>scheduleSettings: {selected.repaymentFrequency} / max {selected.maxInstallments} cuotas</li>
                    <li>collateralSettings: {selected.collateralRequired ? "Requiere garantia" : "No requiere"}</li>
                  </>
                )}
              </ul>
            ) : (
              <ul>
                <li>Selecciona un producto para ver su configuracion detallada.</li>
              </ul>
            )}
          </section>
        </div>
      </div>

      {editor ? (
        <div className="zelify-products-modal-backdrop" onMouseDown={() => setEditor(null)}>
          <div className="zelify-products-modal" onMouseDown={(e) => e.stopPropagation()}>
            <h2>{editor.mode === "create" ? "Crear producto" : "Editar producto"}</h2>
            <p className="zelify-products-crud__meta">
              {mockMambuEndpoints.listEndpoint(form.kind)} - define reglas maestras consumidas en creacion de cuentas.
            </p>
            <div className="zelify-products-modal__grid">
              <label>
                Nombre
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
              </label>
              <label>
                Tipo
                <select
                  value={form.kind}
                  disabled={editor.mode === "edit"}
                  onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as ProductKind }))}
                >
                  <option value="DEPOSIT">DEPOSIT</option>
                  <option value="LOAN">LOAN</option>
                </select>
              </label>
              <label>
                Monto minimo
                <input
                  type="number"
                  value={form.minAmount}
                  onChange={(e) => setForm((p) => ({ ...p, minAmount: Number(e.target.value) }))}
                />
              </label>
              <label>
                Monto maximo
                <input
                  type="number"
                  value={form.maxAmount}
                  onChange={(e) => setForm((p) => ({ ...p, maxAmount: Number(e.target.value) }))}
                />
              </label>
              <label>
                Tasa minima (%)
                <input
                  type="number"
                  step="0.01"
                  value={form.minInterestRate}
                  onChange={(e) => setForm((p) => ({ ...p, minInterestRate: Number(e.target.value) }))}
                />
              </label>
              <label>
                Tasa maxima (%)
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
                    productType
                    <select
                      value={form.productType}
                      onChange={(e) => setForm((p) => ({ ...p, productType: e.target.value as ProductFormInput["productType"] }))}
                    >
                      <option value="CURRENT_ACCOUNT">CURRENT_ACCOUNT</option>
                      <option value="SAVINGS_PLAN">SAVINGS_PLAN</option>
                      <option value="FIXED_DEPOSIT">FIXED_DEPOSIT</option>
                    </select>
                  </label>
                  <label>
                    interestRateSettings
                    <select
                      value={form.interestRateSettings}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, interestRateSettings: e.target.value as ProductFormInput["interestRateSettings"] }))
                      }
                    >
                      <option value="FIXED">FIXED</option>
                      <option value="TIERED">TIERED</option>
                    </select>
                  </label>
                  <label>
                    Sobregiro permitido
                    <select
                      value={form.overdraftAllowed ? "yes" : "no"}
                      onChange={(e) => setForm((p) => ({ ...p, overdraftAllowed: e.target.value === "yes" }))}
                    >
                      <option value="no">No</option>
                      <option value="yes">Si</option>
                    </select>
                  </label>
                  <label>
                    Limite sobregiro
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
                    paymentMethod
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value as ProductFormInput["paymentMethod"] }))}
                    >
                      <option value="EQUATED_INSTALLMENTS">EQUATED_INSTALLMENTS</option>
                      <option value="DECLINING_BALANCE">DECLINING_BALANCE</option>
                    </select>
                  </label>
                  <label>
                    repaymentFrequency
                    <select
                      value={form.repaymentFrequency}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, repaymentFrequency: e.target.value as ProductFormInput["repaymentFrequency"] }))
                      }
                    >
                      <option value="DAILY">DAILY</option>
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                    </select>
                  </label>
                  <label>
                    Cuotas de gracia
                    <input
                      type="number"
                      value={form.gracePeriodInstallments}
                      onChange={(e) => setForm((p) => ({ ...p, gracePeriodInstallments: Number(e.target.value) }))}
                    />
                  </label>
                  <label>
                    Maximo cuotas
                    <input
                      type="number"
                      value={form.maxInstallments}
                      onChange={(e) => setForm((p) => ({ ...p, maxInstallments: Number(e.target.value) }))}
                    />
                  </label>
                  <label>
                    Requiere garantia
                    <select
                      value={form.collateralRequired ? "yes" : "no"}
                      onChange={(e) => setForm((p) => ({ ...p, collateralRequired: e.target.value === "yes" }))}
                    >
                      <option value="no">No</option>
                      <option value="yes">Si</option>
                    </select>
                  </label>
                </>
              )}
            </div>
            {error ? <p style={{ color: "#b91c1c", marginTop: 10 }}>{error}</p> : null}
            <footer className="zelify-products-modal__footer">
              <AppButton type="button" tone="neutral" onClick={() => setEditor(null)}>
                Cancelar
              </AppButton>
              <AppButton type="button" tone="primary" onClick={() => void save()}>
                {editor.mode === "create" ? "Crear producto" : "Guardar cambios"}
              </AppButton>
            </footer>
          </div>
        </div>
      ) : null}
    </div>
  );
}

