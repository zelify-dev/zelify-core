"use client";

import type { CreditClientProfile } from "@/modules/cortex/types/credit-pricing.types";
import { ScotiaSectionHeader, displayClientId } from "@/modules/scotia/components/scotia-section-header";
import { getCreditClientForDeposit } from "@/modules/scotia/data/scotia-demo-bridge";
import type { useLimDemoStore } from "../hooks/use-lim-demo-store";
import { formatMxn, formatPct } from "../services/deposit-pricing.engine";
import type { DemoClient } from "../types/deposit-pricing.types";

type Store = ReturnType<typeof useLimDemoStore>;

function ClientRatesTable({
  title,
  subtitle,
  clients,
  state,
  creditClients,
  showLoanColumn,
}: {
  title: string;
  subtitle?: string;
  clients: DemoClient[];
  state: Store["state"];
  creditClients: CreditClientProfile[];
  showLoanColumn?: boolean;
}) {
  if (clients.length === 0) return null;

  return (
    <section className="scotia-card">
      <div className="scotia-card__head">
        <h3>{title}</h3>
        {subtitle && <span className="lim-td-muted">{subtitle}</span>}
      </div>
      <table className="lim-tbl lim-tbl--list scotia-table-compact">
        <thead>
          <tr>
            {["Cliente", "Saldo depósito", ...(showLoanColumn ? ["Crédito activo"] : []), "Tier", "Tasa"].map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const snap = state.clientRates[client.id];
            const credit = getCreditClientForDeposit(client, creditClients);
            return (
              <tr key={client.id}>
                <td>
                  <strong>{client.name}</strong>
                  <div className="lim-td-muted">{displayClientId(client.id)}</div>
                  {credit && (
                    <span className="lim-credit-link-badge">
                      CORTEX · {displayClientId(credit.id)}
                    </span>
                  )}
                </td>
                <td className="lim-td-n">{formatMxn(client.averageBalance)}</td>
                {showLoanColumn && (
                  <td className="lim-td-n lim-td-credit">
                    {credit ? formatMxn(credit.amount) : client.loanAmountMxn ? formatMxn(client.loanAmountMxn) : "—"}
                  </td>
                )}
                <td>T{snap?.tier ?? "—"}</td>
                <td className="lim-td-n lim-val-up">{snap ? formatPct(snap.rate) : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

export function LimTreasuryDepositsPanel({
  store,
  creditClients = [],
}: {
  store: Store;
  creditClients?: CreditClientProfile[];
}) {
  const { state, treasury } = store;
  const avgRate =
    state.clients.length > 0
      ? state.clients.reduce((sum, c) => sum + (state.clientRates[c.id]?.rate ?? 0), 0) / state.clients.length
      : 0;

  const featuredClients = state.clients.filter((c) => c.featuredCase);
  const creditPortfolioClients = state.clients.filter((c) => !c.featuredCase);

  return (
    <div className="lim-panel scotia-workspace" data-tour="lim-treasury">
      <ScotiaSectionHeader
        badge="LIM · Tesorería"
        title="Cartera de depósitos"
        subtitle="Casos corporativos + cartera CORTEX vinculada · saldos de depósito alineados al crédito activo."
        metric={formatPct(state.tiie.rate)}
        metricLabel="TIIE 28d"
      />

      <div className="scotia-summary-row scotia-summary-row--4">
        <div><span>Saldo total</span><strong>{formatMxn(treasury.totalBalance)}</strong></div>
        <div><span>Clientes</span><strong>{state.clients.length}</strong></div>
        <div><span>Tasa prom. cartera</span><strong>{formatPct(avgRate)}</strong></div>
      </div>

      {treasury.alerts.length > 0 && (
        <section className="scotia-card">
          <div className="scotia-card__head"><h3>Alertas</h3></div>
          <div className="lim-treasury-alerts">
            {treasury.alerts.map((alert) => (
              <div key={alert.id} className={`lim-pricing-alert lim-pricing-alert--${alert.type}`}>
                {alert.message}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="lim-pricing-grid-2">
        <section className="scotia-card">
          <div className="scotia-card__head"><h3>Por tier</h3></div>
          <table className="lim-tbl lim-tbl--list scotia-table-compact">
            <thead>
              <tr>{["Tier", "Clientes", "Saldo", "Tasa prom."].map((h) => <th key={h}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {treasury.clientsByTier.map((row) => (
                <tr key={row.tier}>
                  <td><strong>T{row.tier}</strong></td>
                  <td>{row.count}</td>
                  <td className="lim-td-n">{formatMxn(row.balance)}</td>
                  <td className="lim-td-n lim-val-up">{formatPct(row.avgRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <ClientRatesTable
          title="Casos corporativos · Pricing"
          subtitle="PM-002 / 003 / 004 · vinculados a CORTEX"
          clients={featuredClients}
          state={state}
          creditClients={creditClients}
          showLoanColumn
        />
      </div>

      <ClientRatesTable
        title="Clientes · tasas Pricing (CORTEX)"
        subtitle="Saldo depósito = monto del préstamo activo"
        clients={creditPortfolioClients}
        state={state}
        creditClients={creditClients}
        showLoanColumn
      />
    </div>
  );
}
