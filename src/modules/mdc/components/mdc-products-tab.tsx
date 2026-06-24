"use client";

import { BarChart3, Plus, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MDC_PRODUCTS,
  MDC_PRODUCTS_BY_MODE,
  formatMdcNumber,
  type MdcApplicantMode,
  type MdcProduct,
} from "@/modules/mdc/data/mdc-products-mock";

const PRODUCTS_STORAGE_KEY = "mdc:products";

type ModalMode = "metrics" | "config";
type ModalState = { mode: ModalMode; product: MdcProduct } | null;

function normalizeProductName(name: string) {
  if (name === "BNPL") return "Credito personal";
  if (name === "Prestamo personal") return "Credito automotriz";
  if (name.toLowerCase().includes("plazo fijo")) return "Credito personal";
  return name;
}

function normalizeProductFinancials(product: MdcProduct): MdcProduct {
  const name = normalizeProductName(product.name);
  if (name === "Credito automotriz") {
    return {
      ...product,
      name,
      metrics: {
        activeClients: product.metrics.activeClients < 8 ? 10 : product.metrics.activeClients,
        totalPortfolio: product.metrics.totalPortfolio < 1_000_000 ? 5_460_000 : product.metrics.totalPortfolio,
      },
      configuration: {
        ...product.configuration,
        interestRate: product.configuration.interestRate.max <= 8 ? { min: 13, max: 15 } : product.configuration.interestRate,
        amount: product.configuration.amount.max <= 300_000 ? { min: 100_000, max: 2_500_000 } : product.configuration.amount,
        residualAmount: product.configuration.residualAmount <= 0 ? 20 : product.configuration.residualAmount,
        term: product.configuration.term.max <= 12 ? { min: 12, max: 60, frequency: "mensual" } : product.configuration.term,
      },
    };
  }

  if (name === "Credito personal") {
    return {
      ...product,
      name,
      metrics: {
        activeClients: product.metrics.activeClients < 6 ? 8 : product.metrics.activeClients,
        totalPortfolio: product.metrics.totalPortfolio < 500_000 ? 1_880_000 : product.metrics.totalPortfolio,
      },
      configuration: {
        ...product.configuration,
        interestRate: product.configuration.interestRate.max <= 8 ? { min: 19, max: 22 } : product.configuration.interestRate,
        amount: product.configuration.amount.max <= 10_000 ? { min: 25_000, max: 800_000 } : product.configuration.amount,
        term: product.configuration.term.max <= 12 ? { min: 6, max: 48, frequency: "mensual" } : product.configuration.term,
      },
    };
  }

  return { ...product, name };
}

function readStoredProducts(storageKey: string, defaults: MdcProduct[]) {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as MdcProduct[];
    const stored = parsed
      .filter((product) => !product.name.toLowerCase().includes("plazo fijo"))
      .map(normalizeProductFinancials);
    const knownNames = new Set(stored.map((product) => normalizeProductName(product.name)));
    const missingDefaults = defaults
      .filter((defaultProduct) => !knownNames.has(normalizeProductName(defaultProduct.name)))
      .map(normalizeProductFinancials);
    return [...stored, ...missingDefaults];
  } catch {
    return defaults;
  }
}

function writeStoredProducts(storageKey: string, products: MdcProduct[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(products));
  } catch {
    // noop
  }
}

function formatCurrency(value: number) {
  return `$${formatMdcNumber(value)} MXN`;
}

type MdcProductsTabProps = {
  mode?: MdcApplicantMode;
  storageKey?: string;
  initialProducts?: MdcProduct[];
  title?: string;
  subtitle?: string;
};

export function MdcProductsTab({
  mode = "natural",
  storageKey,
  initialProducts,
  title = "Productos",
  subtitle = "Gestion de productos y performance del portafolio.",
}: MdcProductsTabProps) {
  const effectiveStorageKey = storageKey ?? `${PRODUCTS_STORAGE_KEY}:${mode}`;
  const defaultProducts = initialProducts ?? MDC_PRODUCTS_BY_MODE[mode] ?? MDC_PRODUCTS;
  const [products, setProducts] = useState<MdcProduct[]>(() => readStoredProducts(effectiveStorageKey, defaultProducts));
  const [modal, setModal] = useState<ModalState>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setProducts(readStoredProducts(effectiveStorageKey, defaultProducts));
  }, [defaultProducts, effectiveStorageKey]);

  useEffect(() => {
    writeStoredProducts(effectiveStorageKey, products);
  }, [effectiveStorageKey, products]);

  const activeClients = products.reduce((acc, product) => acc + product.metrics.activeClients, 0);
  const totalPortfolio = products.reduce((acc, product) => acc + product.metrics.totalPortfolio, 0);

  return (
    <section className="mdc-section">
      <article className="mdc-card mdc-prod-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <button type="button" className="mdc-btn mdc-btn--primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Agregar producto
        </button>
      </article>

      <article className="mdc-card">
        <div className="mdc-card__head">
          <h3>Resumen de desempeño</h3>
          <p>Indicadores principales de la familia de productos.</p>
        </div>
        <div className="mdc-prod-summary-grid">
          <MetricCard value={String(activeClients)} label="Clientes activos" />
          <MetricCard value={formatCurrency(totalPortfolio)} label="Cartera total" />
          <MetricCard value="11.1%" label="Tasa de morosidad" />
          <MetricCard value="25.0%" label="Tasa de aprobacion" />
        </div>
      </article>

      <section className="mdc-prod-grid" aria-label="Productos">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOpenConfig={() => setModal({ mode: "config", product })}
            onOpenMetrics={() => setModal({ mode: "metrics", product })}
            onDelete={() => setProducts((prev) => prev.filter((item) => item.id !== product.id))}
          />
        ))}
      </section>

      {modal?.mode === "metrics" ? (
        <MetricsModal product={modal.product} onClose={() => setModal(null)} />
      ) : null}
      {modal?.mode === "config" ? (
        <ConfigPanel
          product={modal.product}
          onClose={() => setModal(null)}
          onSave={(updatedProduct) => {
            setProducts((prev) => prev.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)));
            setModal(null);
          }}
        />
      ) : null}
      {isCreateOpen ? (
        <CreateProductModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={(product) => {
            setProducts((prev) => [product, ...prev]);
            setIsCreateOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}

function MetricCard({ value, label }: { value: string; label: string }) {
  const numberSizeClass = value.length >= 10 ? "mdc-prod-metric__value--sm" : "";
  return (
    <article className="mdc-prod-metric">
      <p className={`mdc-prod-metric__value ${numberSizeClass}`} title={value}>
        {value}
      </p>
      <p className="mdc-prod-metric__label">{label}</p>
    </article>
  );
}

function ProductCard({
  product,
  onOpenConfig,
  onOpenMetrics,
  onDelete,
}: {
  product: MdcProduct;
  onOpenConfig: () => void;
  onOpenMetrics: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="mdc-card mdc-prod-card">
      <header className="mdc-prod-card__head">
        <div>
          <h4>{product.name}</h4>
          <p>{product.description}</p>
        </div>
        <div className="mdc-prod-card__badges">
          <span className="mdc-badge mdc-badge--ok">{product.status}</span>
          <button type="button" onClick={onDelete} aria-label="Eliminar producto" className="mdc-prod-card__delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mdc-prod-card__kpis">
        <MetricCard value={String(product.metrics.activeClients)} label="Clientes activos" />
        <MetricCard value={formatCurrency(product.metrics.totalPortfolio)} label="Cartera total" />
      </div>

      <dl className="mdc-prod-card__rows">
        <div><dt>Tasa de interes</dt><dd>{product.configuration.interestRate.min}% - {product.configuration.interestRate.max}%</dd></div>
        <div><dt>Monto</dt><dd>{formatCurrency(product.configuration.amount.min)} - {formatCurrency(product.configuration.amount.max)}</dd></div>
        <div><dt>Monto residual</dt><dd>{product.configuration.residualAmount}%</dd></div>
        <div><dt>Plazo</dt><dd>{product.configuration.term.min} - {product.configuration.term.max} {product.configuration.term.frequency}</dd></div>
      </dl>

      <div className="mdc-prod-card__actions">
        <button type="button" onClick={onOpenConfig} className="mdc-btn mdc-btn--ghost">
          <Settings2 className="h-4 w-4" /> Configurar
        </button>
        <button type="button" onClick={onOpenMetrics} className="mdc-btn mdc-btn--ghost">
          <BarChart3 className="h-4 w-4" /> Ver metricas
        </button>
      </div>
    </article>
  );
}

function MetricsModal({ product, onClose }: { product: MdcProduct; onClose: () => void }) {
  const averageInterestRate = (product.configuration.interestRate.min + product.configuration.interestRate.max) / 2;

  const stats = useMemo(
    () => ({
      activeClients: product.metrics.activeClients,
      portfolio: product.metrics.totalPortfolio,
      delinquencyRate: product.status === "ACTIVO" ? 6.8 : product.status === "SUSPENDIDO" ? 11.2 : 4.5,
      defaultCredits:
        product.status === "ACTIVO"
          ? Math.max(1, Math.round(product.metrics.activeClients * 0.08))
          : Math.max(0, Math.round(product.metrics.activeClients * 0.03)),
      monthlyInterestIncome: (product.metrics.totalPortfolio * averageInterestRate) / 100 / 12,
    }),
    [averageInterestRate, product],
  );

  return (
    <div className="mdc-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="mdc-modal mdc-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="mdc-modal-head">
          <div>
            <p>Analitica de producto</p>
            <h3>{`Metricas - ${product.name}`}</h3>
          </div>
          <button type="button" onClick={onClose} className="mdc-icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mdc-prod-summary-grid">
          <MetricCard value={String(stats.activeClients)} label="Clientes activos" />
          <MetricCard value={formatCurrency(stats.portfolio)} label="Valor cartera" />
          <MetricCard value={`${stats.delinquencyRate.toFixed(1)}%`} label="Tasa morosidad" />
          <MetricCard value={String(stats.defaultCredits)} label="Creditos en default (+90 dias)" />
          <MetricCard value={formatCurrency(Math.round(stats.monthlyInterestIncome))} label="Intereses mensuales" />
        </div>

        <div className="mdc-prod-charts-grid">
          <article className="mdc-prod-chart-box">
            <h4>Evolucion de cartera</h4>
            <PortfolioTrend />
          </article>
          <article className="mdc-prod-chart-box">
            <h4>Aprobaciones vs rechazos</h4>
            <ApprovalBreakdown />
          </article>
        </div>
      </div>
    </div>
  );
}

function ConfigPanel({
  product,
  onClose,
  onSave,
}: {
  product: MdcProduct;
  onClose: () => void;
  onSave: (product: MdcProduct) => void;
}) {
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [status, setStatus] = useState(product.status);
  const [interestMin, setInterestMin] = useState(String(product.configuration.interestRate.min));
  const [interestMax, setInterestMax] = useState(String(product.configuration.interestRate.max));
  const [amountMin, setAmountMin] = useState(product.configuration.amount.min);
  const [amountMax, setAmountMax] = useState(product.configuration.amount.max);
  const [residualAmount, setResidualAmount] = useState(product.configuration.residualAmount);
  const [termMin, setTermMin] = useState(product.configuration.term.min);
  const [termMax, setTermMax] = useState(product.configuration.term.max);
  const [frequency, setFrequency] = useState(product.configuration.term.frequency);
  const parsedInterestMin = Number(interestMin);
  const parsedInterestMax = Number(interestMax);

  const canSave =
    name.trim().length > 1 &&
    amountMax >= amountMin &&
    interestMin.trim() !== "" &&
    interestMax.trim() !== "" &&
    !Number.isNaN(parsedInterestMin) &&
    !Number.isNaN(parsedInterestMax) &&
    parsedInterestMax >= parsedInterestMin;

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <aside className="mdc-side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mdc-modal-head">
          <div>
            <p>Configuracion</p>
            <h3>{`Configurar - ${product.name}`}</h3>
          </div>
          <button type="button" onClick={onClose} className="mdc-icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mdc-form-grid" onSubmit={(e) => e.preventDefault()}>
          <Field label="Nombre del producto"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Estado">
            <select value={status} onChange={(e) => setStatus(e.target.value as MdcProduct["status"])}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="BORRADOR">BORRADOR</option>
              <option value="SUSPENDIDO">SUSPENDIDO</option>
            </select>
          </Field>
          <Field label="Descripcion" className="mdc-form-grid__full"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} /></Field>
          <Field label="Tasa interes min. (%)"><input type="number" step="any" value={interestMin} onChange={(e) => setInterestMin(e.target.value)} /></Field>
          <Field label="Tasa interes max. (%)"><input type="number" step="any" value={interestMax} onChange={(e) => setInterestMax(e.target.value)} /></Field>
          <Field label="Monto minimo"><input type="number" value={amountMin} onChange={(e) => setAmountMin(Number(e.target.value))} /></Field>
          <Field label="Monto maximo"><input type="number" value={amountMax} onChange={(e) => setAmountMax(Number(e.target.value))} /></Field>
          <Field label="Monto residual (%)"><input type="number" value={residualAmount} onChange={(e) => setResidualAmount(Number(e.target.value))} /></Field>
          <Field label="Frecuencia">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="diario">diario</option>
              <option value="semanal">semanal</option>
              <option value="quincenal">quincenal</option>
              <option value="mensual">mensual</option>
            </select>
          </Field>
          <Field label="Plazo minimo"><input type="number" value={termMin} onChange={(e) => setTermMin(Number(e.target.value))} /></Field>
          <Field label="Plazo maximo"><input type="number" value={termMax} onChange={(e) => setTermMax(Number(e.target.value))} /></Field>

          <div className="mdc-form-grid__full mdc-side-panel__actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              disabled={!canSave}
              onClick={() =>
                onSave({
                  ...product,
                  name: name.trim(),
                  description: description.trim() || "Sin descripcion",
                  status,
                  configuration: {
                    interestRate: { min: parsedInterestMin, max: parsedInterestMax },
                    amount: { min: amountMin, max: amountMax },
                    residualAmount,
                    term: { min: termMin, max: termMax, frequency },
                  },
                })
              }
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function CreateProductModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (product: MdcProduct) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<MdcProduct["status"]>("ACTIVO");
  const [activeClients, setActiveClients] = useState(0);
  const [totalPortfolio, setTotalPortfolio] = useState(0);
  const [interestMin, setInterestMin] = useState("0");
  const [interestMax, setInterestMax] = useState("0");
  const [amountMin, setAmountMin] = useState(0);
  const [amountMax, setAmountMax] = useState(0);
  const [residualAmount, setResidualAmount] = useState(0);
  const [termMin, setTermMin] = useState(1);
  const [termMax, setTermMax] = useState(1);
  const [frequency, setFrequency] = useState("mensual");

  const parsedInterestMin = Number(interestMin);
  const parsedInterestMax = Number(interestMax);

  const isValid =
    name.trim().length > 1 &&
    amountMax >= amountMin &&
    interestMin.trim() !== "" &&
    interestMax.trim() !== "" &&
    !Number.isNaN(parsedInterestMin) &&
    !Number.isNaN(parsedInterestMax) &&
    parsedInterestMax >= parsedInterestMin;

  return (
    <div className="mdc-modal-backdrop" onClick={onClose}>
      <aside className="mdc-side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mdc-modal-head">
          <div>
            <p>Alta de producto</p>
            <h3>Agregar producto</h3>
          </div>
          <button type="button" onClick={onClose} className="mdc-icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mdc-form-grid" onSubmit={(e) => e.preventDefault()}>
          <Field label="Nombre del producto"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Estado">
            <select value={status} onChange={(e) => setStatus(e.target.value as MdcProduct["status"])}>
              <option value="ACTIVO">ACTIVO</option>
              <option value="INACTIVO">INACTIVO</option>
              <option value="BORRADOR">BORRADOR</option>
              <option value="SUSPENDIDO">SUSPENDIDO</option>
            </select>
          </Field>
          <Field label="Descripcion" className="mdc-form-grid__full"><textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Clientes activos"><input type="number" value={activeClients} onChange={(e) => setActiveClients(Number(e.target.value))} /></Field>
          <Field label="Cartera total"><input type="number" value={totalPortfolio} onChange={(e) => setTotalPortfolio(Number(e.target.value))} /></Field>
          <Field label="Tasa interes min. (%)"><input type="number" step="any" value={interestMin} onChange={(e) => setInterestMin(e.target.value)} /></Field>
          <Field label="Tasa interes max. (%)"><input type="number" step="any" value={interestMax} onChange={(e) => setInterestMax(e.target.value)} /></Field>
          <Field label="Monto minimo"><input type="number" value={amountMin} onChange={(e) => setAmountMin(Number(e.target.value))} /></Field>
          <Field label="Monto maximo"><input type="number" value={amountMax} onChange={(e) => setAmountMax(Number(e.target.value))} /></Field>
          <Field label="Monto residual (%)"><input type="number" value={residualAmount} onChange={(e) => setResidualAmount(Number(e.target.value))} /></Field>
          <Field label="Frecuencia">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="diario">diario</option>
              <option value="semanal">semanal</option>
              <option value="quincenal">quincenal</option>
              <option value="mensual">mensual</option>
            </select>
          </Field>
          <Field label="Plazo minimo"><input type="number" value={termMin} onChange={(e) => setTermMin(Number(e.target.value))} /></Field>
          <Field label="Plazo maximo"><input type="number" value={termMax} onChange={(e) => setTermMax(Number(e.target.value))} /></Field>

          <div className="mdc-form-grid__full mdc-side-panel__actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              disabled={!isValid}
              onClick={() => {
                if (!isValid) return;
                onCreate({
                  id: `product_${Date.now()}`,
                  name: name.trim(),
                  description: description.trim() || "Sin descripcion",
                  status,
                  metrics: {
                    activeClients,
                    totalPortfolio,
                  },
                  configuration: {
                    interestRate: { min: parsedInterestMin, max: parsedInterestMax },
                    amount: { min: amountMin, max: amountMax },
                    residualAmount,
                    term: { min: termMin, max: termMax, frequency },
                  },
                });
              }}
            >
              Crear producto
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function PortfolioTrend() {
  const points = [
    { month: "Oct", value: 1900000 },
    { month: "Nov", value: 1200000 },
    { month: "Dic", value: 1500000 },
    { month: "Ene", value: 1820000 },
  ];
  const max = Math.max(...points.map((p) => p.value));

  return (
    <div className="mdc-prod-bars">
      {points.map((point, idx) => {
        const previous = idx > 0 ? points[idx - 1].value : point.value;
        const delta = ((point.value - previous) / previous) * 100;
        const positive = delta >= 0;

        return (
          <div key={point.month} className="mdc-prod-bars__item">
            <div className="mdc-prod-bars__row">
              <span>{point.month}</span>
              <strong>{formatMdcNumber(point.value)}</strong>
            </div>
            <div className="mdc-prod-bars__track">
              <div className="mdc-prod-bars__fill" style={{ width: `${(point.value / max) * 100}%` }} />
            </div>
            <p className={positive ? "mdc-prod-bars__up" : "mdc-prod-bars__down"}>
              {idx === 0 ? "Inicio del periodo" : `${positive ? "+" : ""}${delta.toFixed(1)}% vs mes anterior`}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function ApprovalBreakdown() {
  const periods = [
    { label: "29-01-2026", approved: 24, rejected: 2 },
    { label: "30-01-2026", approved: 29, rejected: 3 },
    { label: "01-02-2026", approved: 20, rejected: 8 },
  ];

  return (
    <div className="mdc-prod-bars">
      {periods.map((period) => {
        const total = period.approved + period.rejected;
        const approvalPct = (period.approved / total) * 100;
        const rejectPct = (period.rejected / total) * 100;

        return (
          <div key={period.label} className="mdc-prod-bars__item">
            <div className="mdc-prod-bars__row mdc-prod-bars__row--muted">
              <span>{period.label}</span>
              <span>{total} solicitudes</span>
            </div>
            <div className="mdc-prod-bars__track"><div className="mdc-prod-bars__fill" style={{ width: `${approvalPct}%` }} /></div>
            <div className="mdc-prod-bars__track"><div className="mdc-prod-bars__fill mdc-prod-bars__fill--red" style={{ width: `${rejectPct}%` }} /></div>
            <div className="mdc-prod-bars__legend">
              <span className="mdc-prod-bars__up">Aprobadas: {period.approved}</span>
              <span className="mdc-prod-bars__down">Rechazadas: {period.rejected}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
