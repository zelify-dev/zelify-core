"use client";
import { createTraceabilityLog } from "@/modules/mdc/services/mdc-traceability.service";

import { BarChart3, Plus, Settings2, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  MDC_PRODUCTS,
  MDC_PRODUCTS_BY_MODE,
  formatMdcNumber,
  type MdcApplicantMode,
  type MdcProduct,
} from "@/modules/mdc/data/mdc-products-mock";
import { getStoredOrganization } from "@/lib/auth-api";

const PRODUCTS_STORAGE_KEY = "mdc:products:v3";

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
        activeClients: 0,
        totalPortfolio: 0,
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
        activeClients: 0,
        totalPortfolio: 0,
      },
      configuration: {
        ...product.configuration,
        interestRate: product.configuration.interestRate.max <= 8 ? { min: 19, max: 22 } : product.configuration.interestRate,
        amount: product.configuration.amount.max <= 10_000 ? { min: 25_000, max: 800_000 } : product.configuration.amount,
        term: product.configuration.term.max <= 12 ? { min: 6, max: 48, frequency: "mensual" } : product.configuration.term,
      },
    };
  }

  return { 
    ...product, 
    name,
    metrics: {
      activeClients: 0,
      totalPortfolio: 0,
    } 
  };
}

function dedupeProducts(products: MdcProduct[]) {
  return [...new Map(products.map((product) => [product.id, product])).values()];
}

function readStoredProducts(storageKey: string, defaults: MdcProduct[]) {
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as MdcProduct[];
    const dedupedStored = dedupeProducts(parsed);
    const stored = dedupedStored
      .filter((product) => !product.name.toLowerCase().includes("plazo fijo"))
      .map(normalizeProductFinancials);
    const knownNames = new Set(stored.map((product) => normalizeProductName(product.name)));
    const missingDefaults = defaults
      .filter((defaultProduct) => !knownNames.has(normalizeProductName(defaultProduct.name)))
      .map(normalizeProductFinancials);
    return dedupeProducts([...stored, ...missingDefaults]);
  } catch {
    return dedupeProducts(defaults);
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
  const num = Number(value);
  if (isNaN(num)) return "$0 MXN";
  return `$${formatMdcNumber(num)} MXN`;
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
  const defaultProducts = useMemo(
    () => dedupeProducts((initialProducts ?? MDC_PRODUCTS_BY_MODE[mode] ?? MDC_PRODUCTS).map(normalizeProductFinancials)),
    [initialProducts, mode],
  );
  const [products, setProducts] = useState<MdcProduct[]>(defaultProducts);
  const [isMounted, setIsMounted] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setProducts(readStoredProducts(effectiveStorageKey, defaultProducts));

    const fetchProducts = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_MDC_API_URL || "http://127.0.0.1:3000";
        const currentOrg = getStoredOrganization();
        const orgId = currentOrg?.id || "ORG-001";
        console.log("=== MDC DEBUG GET ===", { baseUrl, orgId, currentOrg });
        const res = await fetch(`${baseUrl}/finance-products?orgId=${orgId}`);
        if (res.ok) {
          const data = await res.json();
          const backendProducts = data
            .filter((item: any) => mode === "natural" ? item.individualPerson : item.legalEntity)
            .map((item: any) => ({
              id: item.id || `product_${Math.random()}`,
              name: item.financialProduct || "Producto financiero",
              description: `${item.contractType || ""} - ${item.contractDestination || ""}`,
              status: item.status === "ACTIVE" ? "ACTIVO" : "INACTIVO",
              metrics: { 
                activeClients: 0, 
                totalPortfolio: 0 
              },
              configuration: {
                interestRate: { min: item.creditRate || 0, max: item.creditRate || 0 },
                amount: { min: item.minimumAmount || 0, max: item.maximumAmount || 0 },
                residualAmount: 0,
                term: { min: item.dueDatesCount || 1, max: item.dueDatesCount || 1, frequency: (item.paymentFrequency || "mensual").toLowerCase() }
              }
            }));
          setProducts(backendProducts);
        }
      } catch (err) {
        console.error("Failed to load products from API", err);
      }
    };
    fetchProducts();
  }, [defaultProducts, effectiveStorageKey, mode]);

  useEffect(() => {
    if (isMounted) {
      writeStoredProducts(effectiveStorageKey, products);
    }
  }, [effectiveStorageKey, products, isMounted]);

  const activeClients = products.reduce((acc, product) => {
    const val = Number(product.metrics?.activeClients);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);
  
  const totalPortfolio = products.reduce((acc, product) => {
    const val = Number(product.metrics?.totalPortfolio);
    return acc + (isNaN(val) ? 0 : val);
  }, 0);

  const avgMorosidad = products.length > 0 
    ? (products.reduce((acc, p) => acc + (p.status === "ACTIVO" ? 6.8 : p.status === "SUSPENDIDO" ? 11.2 : 4.5), 0) / products.length).toFixed(1)
    : "0.0";
  const avgAprobacion = products.length > 0 ? "25.0" : "0.0";

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
          <MetricCard value={`${avgMorosidad}%`} label="Tasa de morosidad" />
          <MetricCard value={`${avgAprobacion}%`} label="Tasa de aprobacion" />
        </div>
      </article>

      <section className="mdc-prod-grid" aria-label="Productos">
        {dedupeProducts(products).map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
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
      <div style={{ display: isCreateOpen ? "block" : "none" }}>
        <CreateProductModal
          mode={mode}
          onClose={() => setIsCreateOpen(false)}
          onCreate={(newProd) => {
            setProducts([...products, newProd]);
            setIsCreateOpen(false);
          }}
        />
      </div>
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
    <div className="mdc-modal-backdrop" role="dialog" aria-modal="true">
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
    <div className="mdc-modal-backdrop">
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
          <Field label="Tasa interes min. (%)"><input type="number" min="0" step="any" value={interestMin} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) setInterestMin(v); }} /></Field>
          <Field label="Tasa interes max. (%)"><input type="number" min="0" step="any" value={interestMax} onChange={(e) => { const v = e.target.value; if (v === '' || Number(v) >= 0) setInterestMax(v); }} /></Field>
          <Field label="Monto minimo"><input type="number" min="0" value={amountMin} onChange={(e) => setAmountMin(Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Monto maximo"><input type="number" min="0" value={amountMax} onChange={(e) => setAmountMax(Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Monto residual (%)"><input type="number" min="0" value={residualAmount} onChange={(e) => setResidualAmount(Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Frecuencia">
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
              <option value="diario">diario</option>
              <option value="semanal">semanal</option>
              <option value="quincenal">quincenal</option>
              <option value="mensual">mensual</option>
            </select>
          </Field>
          <Field label="Plazo minimo"><input type="number" min="0" value={termMin} onChange={(e) => setTermMin(Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Plazo maximo"><input type="number" min="0" value={termMax} onChange={(e) => setTermMax(Math.max(0, Number(e.target.value)))} /></Field>

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
  mode,
  onClose,
  onCreate,
}: {
  mode: MdcApplicantMode;
  onClose: () => void;
  onCreate: (product: MdcProduct) => void;
}) {
  const [financialProduct, setFinancialProduct] = useState("");
  const [creditRate, setCreditRate] = useState<number | "">(0);
  const [defaultInterestRate, setDefaultInterestRate] = useState<number | "">(0);
  const [ivaType, setIvaType] = useState("GENERAL");
  const [paymentScheme, setPaymentScheme] = useState("AMORTIZADO");
  const [dueDatesCount, setDueDatesCount] = useState<number | "">(12);
  const [creditPoints, setCreditPoints] = useState("0.00000 x 0.00000");
  const [defaultPoints, setDefaultPoints] = useState("0.0000");
  const [ivaZone, setIvaZone] = useState("FRONTERA");
  const [paymentPeriod, setPaymentPeriod] = useState("MENSUAL");
  const [scheme, setScheme] = useState("FIJO");
  const [gracePeriod, setGracePeriod] = useState<number | "">(0);
  const [contractType, setContractType] = useState("APERTURA_CREDITO");
  const [paymentFrequency, setPaymentFrequency] = useState("MENSUAL");
  const [operationalClassification, setOperationalClassification] = useState("COMERCIAL");
  const [minimumAmount, setMinimumAmount] = useState<number | "">(10000);
  const [maximumAmount, setMaximumAmount] = useState<number | "">(500000);

  const individualPerson = mode === "natural";
  const legalEntity = mode === "moral";
  const [businessActivityIndividual, setBusinessActivityIndividual] = useState(true);
  const [indistinct, setIndistinct] = useState(false);
  const [guaranteedWithFega, setGuaranteedWithFega] = useState(false);
  const [guaranteedWithFonaga, setGuaranteedWithFonaga] = useState(false);

  const [contractDestination, setContractDestination] = useState("CAPITAL_TRABAJO");
  const [status, setStatus] = useState("ACTIVE");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isValid = financialProduct.trim().length > 1 && Number(maximumAmount) >= Number(minimumAmount);

  const handleCreate = async () => {
    if (!isValid || isSubmitting) return;
    setIsSubmitting(true);

    const currentOrg = getStoredOrganization();
    const payload = {
      orgId: currentOrg?.id || "ORG-001",
      financialProduct: financialProduct.trim(),
      creditRate: Number(creditRate),
      defaultInterestRate: Number(defaultInterestRate),
      ivaType,
      paymentScheme,
      dueDatesCount: Number(dueDatesCount),
      creditPoints,
      defaultPoints,
      ivaZone,
      paymentPeriod,
      scheme,
      gracePeriod: Number(gracePeriod),
      contractType,
      paymentFrequency,
      operationalClassification,
      minimumAmount: Number(minimumAmount),
      maximumAmount: Number(maximumAmount),
      individualPerson,
      legalEntity,
      businessActivityIndividual,
      indistinct,
      guaranteedWithFega,
      guaranteedWithFonaga,
      contractDestination,
      status
    };

    try {
      const baseUrl = process.env.NEXT_PUBLIC_MDC_API_URL || "http://localhost:3000";
      console.log("=== MDC DEBUG POST ===", { baseUrl, payload });
      const response = await fetch(`${baseUrl}/finance-products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (payload.orgId && payload.orgId !== "demo-bypass-org") {
          await createTraceabilityLog({
            orgId: payload.orgId,
            action: "PRODUCT_CREATE",
            detail: `Producto creado: ${payload.financialProduct}`,
            channel: "Consola",
            userName: "Ejecutivo Zelify",
            correlationId: `corr-prod-${data.id ? data.id.substring(0, 8) : Date.now()}`,
          });
        }
        
        onCreate({
          id: data.id || `product_${Date.now()}`,
          name: financialProduct.trim(),
          description: `${contractType} - ${contractDestination}`,
          status: status === "ACTIVE" ? "ACTIVO" : "INACTIVO",
          metrics: { activeClients: 0, totalPortfolio: 0 },
          configuration: {
            interestRate: { min: Number(creditRate), max: Number(creditRate) },
            amount: { min: Number(minimumAmount), max: Number(maximumAmount) },
            residualAmount: 0,
            term: { min: Number(dueDatesCount), max: Number(dueDatesCount), frequency: paymentFrequency.toLowerCase() }
          }
        });
      } else {
        console.error("Error al crear producto:", await response.text());
        alert("Hubo un error al crear el producto en el backend.");
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("No se pudo conectar al backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mdc-modal-backdrop">
      <aside className="mdc-side-panel" onClick={(e) => e.stopPropagation()}>
        <div className="mdc-modal-head">
          <div>
            <p>Alta de producto financiero</p>
            <h3>Agregar producto</h3>
          </div>
          <button type="button" onClick={onClose} className="mdc-icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form className="mdc-form-grid" onSubmit={(e) => e.preventDefault()} style={{ maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <Field label="Nombre del producto" className="mdc-form-grid__full"><input value={financialProduct} onChange={(e) => setFinancialProduct(e.target.value)} /></Field>

          <Field label="Tasa del crédito (%)"><input type="number" min="0" step="any" value={creditRate} onChange={(e) => setCreditRate(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Tasa moratoria (%)"><input type="number" min="0" step="any" value={defaultInterestRate} onChange={(e) => setDefaultInterestRate(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>

          <Field label="Monto mínimo"><input type="number" min="0" value={minimumAmount} onChange={(e) => setMinimumAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Monto máximo"><input type="number" min="0" value={maximumAmount} onChange={(e) => setMaximumAmount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>

          <Field label="No. Vencimientos"><input type="number" min="0" value={dueDatesCount} onChange={(e) => setDueDatesCount(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>
          <Field label="Gracia (periodos)"><input type="number" min="0" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))} /></Field>

          <Field label="Puntos crédito"><input value={creditPoints} onChange={(e) => setCreditPoints(e.target.value)} /></Field>
          <Field label="Puntos moratorios"><input value={defaultPoints} onChange={(e) => setDefaultPoints(e.target.value)} /></Field>

          <Field label="Tipo de IVA">
            <select value={ivaType} onChange={(e) => setIvaType(e.target.value)}>
              <option value="SIN IVA">SIN IVA</option>
              <option value="GENERAL">GENERAL</option>
            </select>
          </Field>
          <Field label="Zona IVA">
            <select value={ivaZone} onChange={(e) => setIvaZone(e.target.value)}>
              <option value="ZONA 1">ZONA 1</option>
              <option value="FRONTERA">FRONTERA</option>
            </select>
          </Field>

          <Field label="Esquema de pago">
            <select value={paymentScheme} onChange={(e) => setPaymentScheme(e.target.value)}>
              <option value="SIMPLE">SIMPLE</option>
              <option value="AMORTIZADO">AMORTIZADO</option>
            </select>
          </Field>
          <Field label="Periodo de pago">
            <select value={paymentPeriod} onChange={(e) => setPaymentPeriod(e.target.value)}>
              <option value="AL VENCIMIENTO">AL VENCIMIENTO</option>
              <option value="MENSUAL">MENSUAL</option>
            </select>
          </Field>

          <Field label="Esquema">
            <select value={scheme} onChange={(e) => setScheme(e.target.value)}>
              <option value="FIJO">FIJO</option>
              <option value="AMORTIZACIONES CONSTANTES">AMORTIZACIONES CONSTANTES</option>
            </select>
          </Field>
          <Field label="Tipo de contrato">
            <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
              <option value="CREDITO SIMPLE">CREDITO SIMPLE</option>
              <option value="APERTURA_CREDITO">APERTURA_CREDITO</option>
            </select>
          </Field>

          <Field label="Frecuencia de pago">
            <select value={paymentFrequency} onChange={(e) => setPaymentFrequency(e.target.value)}>
              <option value="CATORCENAL">CATORCENAL</option>
              <option value="MENSUAL">MENSUAL</option>
            </select>
          </Field>
          <Field label="Clasificación operativa">
            <select value={operationalClassification} onChange={(e) => setOperationalClassification(e.target.value)}>
              <option value="AL CONSUMO">AL CONSUMO</option>
              <option value="COMERCIAL">COMERCIAL</option>
            </select>
          </Field>

          <Field label="Destino del contrato" className="mdc-form-grid__full">
            <select value={contractDestination} onChange={(e) => setContractDestination(e.target.value)}>
              <option value="CONSUMO">CONSUMO</option>
              <option value="CAPITAL_TRABAJO">CAPITAL_TRABAJO</option>
            </select>
          </Field>

          <fieldset className="mdc-form-grid__full" style={{ border: '1px solid var(--mdc-border)', padding: '1rem 1.25rem 1.25rem', borderRadius: '8px', margin: '0' }}>
            <legend style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--mdc-text-muted)', padding: '0 0.5rem' }}>Elegibilidad y Garantías</legend>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem 1.5rem', marginTop: '0.5rem' }}>
              {([
                { label: 'Física act. empresarial', value: businessActivityIndividual, set: setBusinessActivityIndividual },
                { label: 'Indistinto', value: indistinct, set: setIndistinct },
                { label: 'Garantizado con FEGA', value: guaranteedWithFega, set: setGuaranteedWithFega },
                { label: 'Garantizado con FONAGA', value: guaranteedWithFonaga, set: setGuaranteedWithFonaga },
              ] as { label: string; value: boolean; set: (v: boolean) => void }[]).map(({ label, value, set }) => {
                const id = label.toLowerCase().replace(/\s+/g, '-');
                return (
                  <div key={id} style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--mdc-text)' }}>{label}</span>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--mdc-text-muted)' }}>
                        <input
                          type="radio"
                          name={id}
                          checked={value === true}
                          onChange={() => set(true)}
                          style={{ accentColor: 'var(--mdc-primary, #4f6ef7)', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        Sí
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.8125rem', cursor: 'pointer', color: 'var(--mdc-text-muted)' }}>
                        <input
                          type="radio"
                          name={id}
                          checked={value === false}
                          onChange={() => set(false)}
                          style={{ accentColor: 'var(--mdc-primary, #4f6ef7)', width: '15px', height: '15px', cursor: 'pointer' }}
                        />
                        No
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </fieldset>

          <Field label="Estado" className="mdc-form-grid__full">
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">ACTIVO (ACTIVE)</option>
              <option value="INACTIVE">INACTIVO (INACTIVE)</option>
            </select>
          </Field>

          <div className="mdc-form-grid__full mdc-side-panel__actions">
            <button type="button" className="mdc-btn mdc-btn--ghost" onClick={onClose}>Cancelar</button>
            <button
              type="button"
              className="mdc-btn mdc-btn--primary"
              disabled={!isValid || isSubmitting}
              onClick={handleCreate}
            >
              {isSubmitting ? "Creando..." : "Crear producto"}
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
