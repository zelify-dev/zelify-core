"use client";

import { useEffect, useState } from "react";
import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { getCreditClientForDeposit } from "@/modules/scotia/data/scotia-demo-bridge";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { formatMxn, formatPct } from "../services/deposit-pricing.engine";
import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import type { DemoClient, TierRow } from "../types/deposit-pricing.types";

type Store = ReturnType<typeof useLimDemoStore>;

const PRICING_CASES = [
  {
    id: "PM-DEMO-002",
    caseLabel: "Caso 1",
    caseTitle: "Pricing estándar",
    tourId: "lim-client-pm002",
    accent: "standard" as const,
  },
  {
    id: "PM-DEMO-003",
    caseLabel: "Caso 2",
    caseTitle: "Tasa mínima VIP",
    tourId: "lim-override-pm003",
    accent: "vip" as const,
  },
  {
    id: "PM-DEMO-004",
    caseLabel: "Caso 3",
    caseTitle: "Bonificación",
    tourId: "lim-bonus-pm004",
    accent: "bonus" as const,
  },
];

function TierTableEditor({
  title,
  tiers,
  tiieRate,
  onSave,
}: {
  title: string;
  tiers: TierRow[];
  tiieRate: number;
  onSave: (tiers: TierRow[]) => void;
}) {
  const [local, setLocal] = useState(tiers);
  const [saved, setSaved] = useState(false);

  useEffect(() => setLocal(tiers), [tiers]);

  return (
    <section className="scotia-card scotia-card--nested">
      <div className="scotia-card__head">
        <h3>{title}</h3>
        <button
          type="button"
          className="lim-btn-primary lim-btn-sm"
          onClick={() => {
            onSave(local);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        >
          {saved ? "Guardado" : "Guardar"}
        </button>
      </div>
      <table className="lim-tbl lim-tbl--list scotia-table-compact">
        <thead>
          <tr>
            {["Tier", "Saldo", "Factor", "Tasa"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {local.map((tier) => (
            <tr key={tier.id}>
              <td>
                <strong>T{tier.tier}</strong>
              </td>
              <td className="lim-td-muted">{tier.label}</td>
              <td>
                <input
                  className="lim-pricing-input"
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={tier.tiieFactor}
                  onChange={(e) => {
                    const factor = parseFloat(e.target.value) || 0;
                    setLocal((prev) => prev.map((t) => (t.id === tier.id ? { ...t, tiieFactor: factor } : t)));
                    setSaved(false);
                  }}
                />
              </td>
              <td className="lim-td-n lim-val-up">{formatPct(tiieRate * tier.tiieFactor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function ClientCaseCard({
  client,
  pricing,
  caseLabel,
  caseTitle,
  accent,
  tourId,
  selected,
  override,
  bonus,
  linkedCredit,
  onSelect,
  onToggleBonus,
}: {
  client: DemoClient;
  pricing: NonNullable<ReturnType<Store["getClientPricing"]>>;
  caseLabel: string;
  caseTitle: string;
  accent: "standard" | "vip" | "bonus";
  tourId: string;
  selected: boolean;
  override?: { capMin?: number; notes?: string };
  bonus?: { id: string; active: boolean; conditionLabel: string };
  linkedCredit?: CreditClientProfile;
  onSelect: () => void;
  onToggleBonus?: (active: boolean) => void;
}) {
  return (
    <article
      className={`scotia-case-card scotia-case-card--${accent}${selected ? " scotia-case-card--active" : ""}`}
      data-tour={tourId}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      role="button"
      tabIndex={0}
    >
      <header className="scotia-case-card__head">
        <span className="scotia-case-card__label">{caseLabel}</span>
        <span className="scotia-case-card__type">{caseTitle}</span>
      </header>
      <h4 className="scotia-case-card__name">{client.name}</h4>
      <p className="scotia-case-card__meta">
        {displayClientId(client.id)} · {formatMxn(client.averageBalance)} · T{pricing.tier}
      </p>
      <p className="scotia-case-card__rate">{formatPct(pricing.rate)}</p>
      {linkedCredit && (
        <p className="scotia-case-card__detail scotia-case-card__detail--credit">
          Crédito CORTEX · {displayClientId(linkedCredit.id)} · {formatMxn(linkedCredit.amount)}
        </p>
      )}
      {accent === "standard" && (
        <p className="scotia-case-card__detail">
          {formatPct(pricing.tiieRate)} × {Math.round(pricing.factor * 100)}%
        </p>
      )}
      {override && (
        <p className="scotia-case-card__detail scotia-case-card__detail--vip">
          Mínimo acordado {formatPct(override.capMin ?? 0)}
        </p>
      )}
      {bonus && (
        <div className="scotia-case-card__bonus" onClick={(e) => e.stopPropagation()}>
          <span>{bonus.conditionLabel}</span>
          <label className="lim-pricing-toggle">
            <input type="checkbox" checked={bonus.active} onChange={(e) => onToggleBonus?.(e.target.checked)} />
            {bonus.active ? "Activa" : "Off"}
          </label>
        </div>
      )}
    </article>
  );
}

export function LimDepositPricingPanel({
  store,
  creditClients = [],
  selectedClient,
  onSelectedClientChange,
}: {
  store: Store;
  creditClients?: CreditClientProfile[];
  selectedClient: string;
  onSelectedClientChange: (id: string) => void;
}) {
  const { state, updateTiersPm, updateTiersPf, simulateTiieChange, approvePendingTiie, toggleBonus } = store;
  const [simulating, setSimulating] = useState(false);

  const recalcPm002 = state.auditLog.find((e) => e.clientId === "PM-DEMO-002" && e.action === "RECALC_TIIE");
  const creditPortfolio = state.clients.filter((c) => !c.featuredCase);

  return (
    <div className="lim-panel scotia-workspace">
      <ScotiaSectionHeader
        badge="LIM · Depósitos"
        title="Pricing dinámico"
        subtitle="Tres escenarios corporativos en paralelo + cartera CORTEX vinculada."
        metric={formatPct(state.tiie.rate)}
        metricLabel="TIIE 28d"
      />

      <section className="scotia-card scotia-card--flat" data-tour="lim-tiers-config">
        <div className="scotia-card__head">
          <h3>Tablas tier</h3>
          <span className="lim-td-muted">Vigencia {state.tiie.effectiveDate}</span>
        </div>
        <div className="lim-pricing-grid-2">
          <TierTableEditor title="Persona moral" tiers={state.tiersPm} tiieRate={state.tiie.rate} onSave={updateTiersPm} />
          <TierTableEditor title="Persona física" tiers={state.tiersPf} tiieRate={state.tiie.rate} onSave={updateTiersPf} />
        </div>
      </section>

      <section className="scotia-card" data-tour="lim-tiie-recalc">
        <div className="scotia-card__head">
          <h3>Recálculo por TIIE</h3>
        </div>
        <div className="lim-pricing-actions">
          <button
            type="button"
            className={`lim-btn-primary${simulating ? " lim-btn--loading" : ""}`}
            onClick={() => {
              setSimulating(true);
              simulateTiieChange(9.5);
              setTimeout(() => setSimulating(false), 800);
            }}
          >
            TIIE 9.50%
          </button>
          <button type="button" className="lim-btn-ghost" onClick={() => simulateTiieChange(10.5)}>
            Restaurar 10.50%
          </button>
        </div>
        {state.pendingApproval?.status === "PENDING" && (
          <div className="lim-pricing-alert lim-pricing-alert--warn">
            <strong>Aprobación tesorería</strong>
            <span>
              {state.pendingApproval.variationBps >= 0 ? "+" : ""}
              {state.pendingApproval.variationBps} pbs
            </span>
            <button type="button" className="lim-btn-primary lim-btn-sm" onClick={approvePendingTiie}>
              Aprobar
            </button>
          </div>
        )}
        {recalcPm002?.rateBefore !== undefined && recalcPm002.rateAfter !== undefined && (
          <div className="lim-recalc-before-after">
            <strong>Caso 1 · recálculo automático</strong>
            <div className="lim-recalc-values">
              <span className="lim-recalc-before">{formatPct(recalcPm002.rateBefore)}</span>
              <span className="lim-recalc-arrow">→</span>
              <span className="lim-recalc-after">{formatPct(recalcPm002.rateAfter)}</span>
            </div>
          </div>
        )}
      </section>

      <section className="scotia-card" data-tour="lim-client-pricing">
        <div className="scotia-card__head">
          <h3>Casos corporativos</h3>
          <span className="lim-td-muted">Comparación en paralelo</span>
        </div>
        <div className="scotia-cases-grid">
          {PRICING_CASES.map((c) => {
            const client = state.clients.find((cl) => cl.id === c.id);
            const pricing = client ? store.getClientPricing(client.id) : null;
            if (!client || !pricing) return null;
            return (
              <ClientCaseCard
                key={c.id}
                client={client}
                pricing={pricing}
                caseLabel={c.caseLabel}
                caseTitle={c.caseTitle}
                accent={c.accent}
                tourId={c.tourId}
                selected={selectedClient === c.id}
                override={state.overrides.find((o) => o.clientId === c.id)}
                bonus={state.bonuses.find((b) => b.clientId === c.id)}
                linkedCredit={getCreditClientForDeposit(client, creditClients)}
                onSelect={() => onSelectedClientChange(c.id)}
                onToggleBonus={(active) => {
                  const b = state.bonuses.find((x) => x.clientId === c.id);
                  if (b) toggleBonus(b.id, active);
                }}
              />
            );
          })}
        </div>
      </section>

      {creditPortfolio.length > 0 && (
        <section className="scotia-card scotia-card--flat lim-pricing-credit-portfolio" data-tour="lim-credit-deposits">
          <div className="scotia-card__head">
            <h3>Cartera CORTEX · depósitos vinculados</h3>
            <span className="lim-td-muted">Saldo depósito = monto del préstamo · sincronizado con cotización</span>
          </div>
          <div className="lim-credit-deposit-grid">
            {creditPortfolio.map((client) => {
              const pricing = store.getClientPricing(client.id);
              const credit = getCreditClientForDeposit(client, creditClients);
              if (!pricing) return null;
              return (
                <article key={client.id} className="lim-credit-deposit-card">
                  <strong>{client.name}</strong>
                  <span className="lim-td-muted">{displayClientId(client.id)}</span>
                  <div className="lim-credit-deposit-card__row">
                    <span>Depósito</span>
                    <strong>{formatMxn(client.averageBalance)}</strong>
                  </div>
                  <div className="lim-credit-deposit-card__row">
                    <span>Tasa</span>
                    <strong className="lim-val-up">{formatPct(pricing.rate)}</strong>
                  </div>
                  {credit && (
                    <div className="lim-credit-deposit-card__row">
                      <span>Crédito</span>
                      <strong>{formatMxn(credit.amount)} · {credit.termMonths}m</strong>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="scotia-card scotia-card--flat lim-pricing-treasury-preview">
        <div className="scotia-card__head">
          <h3>Vista Tesorería</h3>
          <span className="lim-td-muted">Actualización dinámica · mismo motor LIM</span>
        </div>
        <div className="scotia-summary-row scotia-summary-row--4">
          <div><span>Saldo cartera</span><strong>{formatMxn(store.treasury.totalBalance)}</strong></div>
          <div><span>NII anual proyectado</span><strong className="lim-val-up">{formatMxn(store.treasury.projectedNii)}</strong></div>
          <div><span>Clientes</span><strong>{state.clients.length}</strong></div>
          <div><span>Alertas activas</span><strong>{store.treasury.alerts.length}</strong></div>
        </div>
      </section>
    </div>
  );
}
