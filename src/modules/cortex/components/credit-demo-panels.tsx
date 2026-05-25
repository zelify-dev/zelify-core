"use client";

import { useEffect, useState } from "react";
import { CATEGORY_LABELS } from "../data/credit-catalog";
import type { useCreditDemoStore } from "../hooks/use-credit-demo-store";
import {
  aiPropensity,
  evaluateRuleCompliance,
  formatMxnCredit,
  formatPctCredit,
  rateBeforeCrossSell,
} from "../services/credit-pricing.engine";
import type { CreditClientProfile, CreditProductCategory, CreditProductTemplate } from "../types/credit-pricing.types";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { CreditRulesPanel } from "./credit-rules-panel";
import { CreditQuoteResultPanel } from "./credit-quote-result-panel";
import "./credit-rules-panel.css";

type Store = ReturnType<typeof useCreditDemoStore>;

export function CreditAdminPanel({ store, activeCategory }: { store: Store; activeCategory: CreditProductCategory }) {
  const { state, selectClient, updateProduct } = store;
  const product = store.getProduct();
  const [local, setLocal] = useState(product);
  const [saved, setSaved] = useState(false);
  const [detailClient, setDetailClient] = useState<CreditClientProfile | null>(null);

  useEffect(() => setLocal(store.getProduct()), [state.selectedProductId, store]);

  const categoryProducts = state.products.filter((p) => p.category === activeCategory);
  const clientsInCategory = state.clients.filter(
    (c) => state.products.find((p) => p.id === c.productId)?.category === activeCategory,
  );

  return (
    <div className="lim-panel scotia-workspace" data-tour="credit-product-admin">
      <ScotiaSectionHeader
        badge="CORTEX · Crédito"
        title="Catálogo de productos"
        subtitle={`${CATEGORY_LABELS[activeCategory]} · selecciona cliente y parametriza producto.`}
      />

      <section className="scotia-card">
        <div className="scotia-card__head">
          <h3>Clientes · {CATEGORY_LABELS[activeCategory]}</h3>
          <span className="lim-td-muted">Selecciona cliente activo · clic para KYC/KYB</span>
        </div>
        <div className="scotia-credit-clients-grid">
          {clientsInCategory.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`scotia-credit-client-card${state.selectedClientId === c.id ? " scotia-credit-client-card--active" : ""}`}
              onClick={() => {
                selectClient(c.id);
                setDetailClient(c);
              }}
            >
              <span className="scotia-credit-client-card__type">{c.entityType === "PM" ? "Empresa" : "Persona"}</span>
              <strong>{c.name}</strong>
              <span>{displayClientId(c.id)} · Score {c.creditScore}</span>
              {c.sourceCustomerId && (
                <span className="lim-pill lim-pill--blue">Cliente Zelify · {c.sourceCustomerId}</span>
              )}
              <span className={`lim-pill lim-pill--${c.aiApproved === false ? "red" : c.aiApproved ? "green" : "yellow"}`}>
                {c.aiApproved === false ? "Rechazado IA" : c.aiApproved ? "Aprobado IA" : "Pendiente IA"}
              </span>
            </button>
          ))}
        </div>
      </section>

      {detailClient && (
        <ClientDetailModal
          client={detailClient}
          product={state.products.find((p) => p.id === detailClient.productId)!}
          onClose={() => setDetailClient(null)}
        />
      )}

      <section className="scotia-card" data-tour="credit-product-params">
        <div className="scotia-card__head">
          <h3>Parámetros · {local.name}</h3>
          <select
            className="lim-sel"
            value={local.id}
            onChange={(e) => {
              store.selectProduct(e.target.value);
              setLocal(store.getProduct(e.target.value));
            }}
          >
            {categoryProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id} · {p.name}
              </option>
            ))}
          </select>
        </div>
        <p className="scotia-card__hint">{local.description}</p>
        <ul className="scotia-restrictions-list">
          {local.restrictions.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="scotia-summary-row">
          <div><span>Tasa base</span><strong>{local.baseRate}%</strong></div>
          <div><span>Banda</span><strong>{local.discountBandMin}% – {local.discountBandMax}%</strong></div>
          <div><span>Plazos</span><strong>{local.termMinMonths}–{local.termMaxMonths} meses</strong></div>
          <div><span>Monto máx.</span><strong>{formatMxnCredit(local.amountMax)}</strong></div>
        </div>
        <div className="lim-credit-params-grid">
          <ParamField label="Tasa base (%)" type="number" value={String(local.baseRate)} onChange={(v) => setLocal({ ...local, baseRate: parseFloat(v) || 0 })} />
          <ParamField label="Banda mín (%)" type="number" value={String(local.discountBandMin)} onChange={(v) => setLocal({ ...local, discountBandMin: parseFloat(v) || 0 })} />
          <ParamField label="Banda máx (%)" type="number" value={String(local.discountBandMax)} onChange={(v) => setLocal({ ...local, discountBandMax: parseFloat(v) || 0 })} />
          <ParamField label="Plazo mín" type="number" value={String(local.termMinMonths)} onChange={(v) => setLocal({ ...local, termMinMonths: parseInt(v) || 0 })} />
          <ParamField label="Plazo máx" type="number" value={String(local.termMaxMonths)} onChange={(v) => setLocal({ ...local, termMaxMonths: parseInt(v) || 0 })} />
          <ParamField label="Comisión (%)" type="number" value={String(local.openingFeePct)} onChange={(v) => setLocal({ ...local, openingFeePct: parseFloat(v) || 0 })} />
        </div>
        <button
          type="button"
          className="lim-btn-primary lim-btn-sm"
          onClick={() => {
            updateProduct(local);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "Parámetros fijados" : "Fijar parámetros"}
        </button>
      </section>
    </div>
  );
}

export function CreditQuotePanel({ store, activeCategory }: { store: Store; activeCategory: CreditProductCategory }) {
  const { state, runQuote, setCrossSellOption, runAiVerification, approveManager, fixQuote, toggleRule, selectClient } = store;
  const product = store.getProduct();
  const client = store.getClient();
  const q = state.quote;
  const floor = product.discountBandMin;
  const crossSellOptions = state.crossSellByCategory[product.category];
  const crossSellLabels = crossSellOptions.map((o) => o.label);
  const propensity = aiPropensity(client);
  const categoryClients = state.clients.filter(
    (c) => state.products.find((p) => p.id === c.productId)?.category === activeCategory,
  );
  const batchClients = categoryClients.slice(0, 4);
  const compliance = evaluateRuleCompliance(client, product, state.rulesByCategory[activeCategory]);
  const complianceOk = compliance.every((r) => r.passed);
  const scoreOk = client.creditScore >= 650;

  useEffect(() => {
    if (!state.quote) runQuote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.selectedClientId, state.selectedProductId]);

  const baseBeforeCross = q ? rateBeforeCrossSell(q.baseRate, q.discountsApplied, crossSellLabels) : product.baseRate;
  const totalCrossBps = crossSellOptions.filter((o) => state.crossSellAccepted[o.id]).reduce((s, o) => s + o.bps, 0);
  const potentialCrossBps = crossSellOptions.filter((o) => !state.crossSellAccepted[o.id]).reduce((s, o) => s + o.bps, 0);

  return (
    <div className="lim-panel scotia-workspace">
      <ScotiaSectionHeader
        badge="CORTEX · Cotización"
        title="Motor de decisión"
        subtitle={`${CATEGORY_LABELS[activeCategory]} · ${client.name}`}
        metric={q ? formatPctCredit(q.finalRate) : "—"}
        metricLabel="Tasa"
      />

      <section className="scotia-card scotia-card--inline-metrics" data-tour="credit-active-params">
        <div className="scotia-inline-metrics">
          <span>Producto <strong>{product.id}</strong></span>
          <span>Banda <strong>{product.discountBandMin}%–{product.discountBandMax}%</strong></span>
          <span>Plazo <strong>{client.termMonths} meses</strong></span>
          <span>Monto <strong>{formatMxnCredit(client.amount)}</strong></span>
        </div>
      </section>

      <section className="scotia-card scotia-data-layer scotia-data-layer--compact" data-tour="credit-data-layer">
        <div className="scotia-card__head scotia-card__head--minimal">
          <h3>Origen de datos</h3>
          <AppBadge tone="neutral">Sincronizado</AppBadge>
        </div>
        <div className="scotia-data-flow scotia-data-flow--compact">
          <span>Core Banking</span>
          <span>→</span>
          <span>Data Layer</span>
          <span>→</span>
          <span>CORTEX</span>
        </div>
      </section>

      <CreditRulesPanel
        category={activeCategory}
        rules={state.rulesByCategory[activeCategory]}
        onToggle={(ruleId, enabled) => toggleRule(activeCategory, ruleId, enabled)}
      />

      <section className="scotia-card scotia-card--flat" data-tour="credit-quote-clients">
        <div className="scotia-card__head">
          <h3>Clientes · verificación KYC/KYB</h3>
          <span className="lim-td-muted">Batch de {batchClients.length} · selecciona para cotizar</span>
        </div>
        <div className="scotia-credit-clients-grid scotia-credit-clients-grid--4">
          {batchClients.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`scotia-credit-client-card${state.selectedClientId === c.id ? " scotia-credit-client-card--active" : ""}`}
              onClick={() => selectClient(c.id)}
            >
              <span className="scotia-credit-client-card__type">{c.entityType === "PM" ? "Empresa" : "Persona"}</span>
              <strong>{c.name}</strong>
              <span>{displayClientId(c.id)} · Score {c.creditScore}</span>
              {c.sourceCustomerId && (
                <span className="lim-pill lim-pill--blue">Cliente Zelify · {c.sourceCustomerId}</span>
              )}
              <span className={`lim-pill lim-pill--${c.aiApproved === false ? "red" : c.aiApproved ? "green" : "yellow"}`}>
                {c.aiApproved === false ? "Rechazado IA" : c.aiApproved ? "Aprobado IA" : "Pendiente IA"}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="cortex-ai-panel" data-tour="credit-ai-recommend">
        <header className="cortex-ai-panel__header">
          <div>
            <p className="cortex-ai-panel__eyebrow">Paso 3 · Verificación</p>
            <h3>Scoring inteligente CORTEX</h3>
            <p className="cortex-ai-panel__hint">Ejecutar después de configurar reglas y seleccionar cliente.</p>
          </div>
          <div className="cortex-ai-panel__metric">
            <span>Propensión cross-sell</span>
            <strong>{propensity}%</strong>
          </div>
        </header>
        <p className="cortex-ai-panel__rec">
          Sugerencia: {crossSellOptions.slice(0, 2).map((o) => o.label).join(" + ")} · hasta −{crossSellOptions.slice(0, 2).reduce((s, o) => s + o.bps, 0)} pbs
        </p>
        <div className="cortex-ai-panel__actions">
          <AppButton tone="primary" className="cortex-btn--lg" onClick={runAiVerification} data-tour="credit-ai-verify-btn">
            {state.aiVerificationRun ? "Re-ejecutar verificación" : "Ejecutar verificación IA"}
          </AppButton>
        </div>
        {state.aiBatchResults.length > 0 && (
          <div className="cortex-ai-panel__batch" data-tour="credit-ai-batch">
            <table className="cortex-ai-panel__table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Score</th>
                  <th>Resultado</th>
                </tr>
              </thead>
              <tbody>
                {state.aiBatchResults.map((r) => (
                  <tr key={r.clientId}>
                    <td>{r.clientName}</td>
                    <td>{r.score}</td>
                    <td>
                      <AppBadge tone={r.approved ? "success" : "error"} size="sm">
                        {r.approved ? "Aprobado" : "Rechazado"}
                      </AppBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="cortex-ai-panel__summary">
              {state.aiBatchResults.filter((r) => r.approved).length} aprobados · {state.aiBatchResults.filter((r) => !r.approved).length} rechazado(s)
            </p>
          </div>
        )}
      </section>

      {state.aiVerificationRun && q && (
        <CreditQuoteResultPanel
          client={client}
          quote={q}
          compliance={compliance}
          complianceOk={complianceOk}
          scoreOk={scoreOk}
          floor={floor}
          baseBeforeCross={baseBeforeCross}
          crossSellOptions={crossSellOptions}
          crossSellAccepted={state.crossSellAccepted}
          totalCrossBps={totalCrossBps}
          potentialCrossBps={potentialCrossBps}
          onCrossSellToggle={setCrossSellOption}
          managerApproved={state.managerApproved}
          quoteFixed={state.quoteFixed}
          quoteFixedAt={state.quoteFixedAt}
          onApproveManager={approveManager}
          onFixQuote={fixQuote}
        />
      )}
    </div>
  );
}

export function CreditAuditPanel({ store }: { store: Store }) {
  const { state } = store;
  return (
    <div className="lim-panel scotia-workspace" data-tour="credit-audit-log">
      <ScotiaSectionHeader badge="CORTEX · Auditoría" title="Trazabilidad" subtitle="Reglas, IA, cross-sell y fijaciones." />
      <section className="scotia-card">
        <table className="lim-tbl lim-tbl--list scotia-table-compact">
          <thead><tr>{["Fecha", "Acción", "Detalle", "Canal", "Usuario", "Tasa"].map((h) => <th key={h}>{h}</th>)}</tr></thead>
          <tbody>
            {state.auditLog.map((e) => (
              <tr key={e.id}>
                <td className="lim-td-muted">{new Date(e.timestamp).toLocaleString("es-MX")}</td>
                <td><span className="lim-pill lim-pill--blue">{e.action}</span></td>
                <td className="lim-td-muted">{e.details}</td>
                <td>{e.channel}</td>
                <td>{e.user}</td>
                <td className="lim-td-n">{e.rateAfter !== undefined ? formatPctCredit(e.rateAfter) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function ClientDetailModal({
  client,
  product,
  onClose,
}: {
  client: CreditClientProfile;
  product: CreditProductTemplate;
  onClose: () => void;
}) {
  return (
    <div className="scotia-modal-backdrop" onClick={onClose}>
      <div className="scotia-modal" onClick={(e) => e.stopPropagation()}>
        <div className="scotia-modal__head">
          <h3>{client.name}</h3>
          <button type="button" className="scotia-tour-close" onClick={onClose}>×</button>
        </div>
        <p className="scotia-card__hint">{product.name} · {formatMxnCredit(client.amount)} · {client.termMonths} meses</p>
        <div className="scotia-modal__grid">
          <div><span>Score</span><strong>{client.creditScore}</strong></div>
          <div><span>Tipo</span><strong>{client.entityType === "PM" ? "Persona moral" : "Persona física"}</strong></div>
          <div><span>RFC</span><strong>{client.kyc.rfc}</strong></div>
          {client.kyc.curp && <div><span>CURP</span><strong>{client.kyc.curp}</strong></div>}
          <div><span>Teléfono</span><strong>{client.kyc.phone}</strong></div>
          <div><span>Email</span><strong>{client.kyc.email}</strong></div>
          {client.kyc.birthDate && <div><span>Nacimiento</span><strong>{client.kyc.birthDate}</strong></div>}
          <div><span>Dirección</span><strong>{client.kyc.address}</strong></div>
          {client.kyc.idDocument && <div><span>INE</span><strong>{client.kyc.idDocument}</strong></div>}
          <div><span>KYC</span><strong>{client.kyc.idVerified ? "Verificado" : "Pendiente"}</strong></div>
          <div><span>AML</span><strong>{client.kyc.amlApproved ? "Aprobado" : client.kyb?.amlRisk ?? "Pendiente"}</strong></div>
          <div><span>PEP</span><strong>{client.kyc.pep ? "Sí" : "No"}</strong></div>
          {client.kyc.incomeMonthly && <div><span>Ingreso</span><strong>{formatMxnCredit(client.kyc.incomeMonthly)}/mes</strong></div>}
        </div>
        {client.kyb && (
          <>
            <h4>KYB · Persona moral</h4>
            <div className="scotia-modal__grid">
              <div><span>Razón social</span><strong>{client.kyb.legalName}</strong></div>
              <div><span>Sector</span><strong>{client.kyb.sector}</strong></div>
              <div><span>Empleados</span><strong>{client.kyb.employees}</strong></div>
              <div><span>AML</span><strong>{client.kyb.amlRisk}</strong></div>
              <div><span>Beneficiarios</span><strong>{client.kyb.beneficialOwnersVerified ? "Verificados" : "Pendiente"}</strong></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ParamField({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="lim-credit-param">
      <span>{label}</span>
      <input className="lim-pricing-input lim-credit-param-input" type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
