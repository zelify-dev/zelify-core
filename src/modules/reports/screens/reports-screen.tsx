"use client";

import { useSearchParams } from "next/navigation";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";

import "@/components/ui/templates/workspace-page.css";
import "./reports-screen.css";

const ORG_KPIS = [
  { label: "Total Clientes", value: "12,420" },
  { label: "Cartera Bruta", value: "$42,581,900" },
  { label: "PAR>30", value: "4.8%" },
];

const PRODUCT_COMPOSITION = [
  { name: "Microcrédito", value: 46 },
  { name: "PYME", value: 32 },
  { name: "Consumo", value: 22 },
];

const DISBURSEMENT_RECOVERY = [
  { month: "Ene", disbursement: 140, recovery: 110 },
  { month: "Feb", disbursement: 132, recovery: 118 },
  { month: "Mar", disbursement: 150, recovery: 131 },
  { month: "Abr", disbursement: 170, recovery: 142 },
];

const OUTREACH = [
  { zone: "Rural", value: 58 },
  { zone: "Urbana", value: 42 },
];

const INDICATORS_TREND = [
  { month: "Jan", activeClients: 11420, activeLoans: 7620, transactions: 240200 },
  { month: "Feb", activeClients: 11790, activeLoans: 7810, transactions: 252420 },
  { month: "Mar", activeClients: 12110, activeLoans: 8044, transactions: 266180 },
  { month: "Apr", activeClients: 12420, activeLoans: 8215, transactions: 284901 },
];

const EARNINGS_BREAKDOWN = [
  { month: "Jan", interestIncome: 490, feeIncome: 128, operatingExpense: 362 },
  { month: "Feb", interestIncome: 512, feeIncome: 134, operatingExpense: 369 },
  { month: "Mar", interestIncome: 538, feeIncome: 141, operatingExpense: 378 },
  { month: "Apr", interestIncome: 556, feeIncome: 153, operatingExpense: 395 },
];

const RISK_BUCKETS = [
  { bucket: "PAR 1-30", value: 2.1 },
  { bucket: "PAR 31-60", value: 1.4 },
  { bucket: "PAR 61-90", value: 0.9 },
  { bucket: "PAR 90+", value: 0.5 },
];

const RISK_HEATMAP = [
  { branch: "North", riskScore: 62, cases: 44 },
  { branch: "Central", riskScore: 54, cases: 31 },
  { branch: "South", riskScore: 71, cases: 52 },
  { branch: "Metro", riskScore: 48, cases: 26 },
];

function localizeText(text: string, locale: "en" | "es"): string {
  const [en, es] = text.split(" / ");
  if (!es) return text;
  return locale === "es" ? es : en;
}

export function ReportsScreen() {
  const { locale } = useI18n();
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isDefault = !view;
  const isOrg = view === "organization";
  const isOutreach = view === "outreach";
  const isIndicators = view === "indicators";
  const isEarnings = view === "earnings";
  const isRisk = view === "risk";

  const title = (() => {
    if (isOrg) return localizeText("Reporting - Branches / Informes - Sedes", locale);
    if (isOutreach) return localizeText("Reporting - Outreach / Informes - Alcance", locale);
    if (isIndicators) return localizeText("Reporting - Indicators / Informes - Indicadores", locale);
    if (isEarnings) return localizeText("Reporting - Earnings / Informes - Ganancias", locale);
    if (isRisk) return localizeText("Reporting - Risk / Informes - Riesgo", locale);
    return localizeText("Reporting / Informes", locale);
  })();

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">{title}</h1>

          {isOrg ? (
            <>
              <div className="zelify-report-kpi-grid">
                {ORG_KPIS.map((kpi) => (
                  <article key={kpi.label} className="zelify-report-card">
                    <span>{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                  </article>
                ))}
              </div>

              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>Composición de Cartera por Producto</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={PRODUCT_COMPOSITION} dataKey="value" nameKey="name" outerRadius={95}>
                        {PRODUCT_COMPOSITION.map((_, i) => (
                          <Cell key={i} fill={["#3b82f6", "#6366f1", "#14b8a6"][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </article>

                <article className="zelify-report-card">
                  <h3>Desembolsos vs Recuperación Mensual</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={DISBURSEMENT_RECOVERY}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="disbursement" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="recovery" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
              </div>
            </>
          ) : null}

          {isOutreach ? (
            <>
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card">
                  <span>% Mujeres en Cartera</span>
                  <strong>61%</strong>
                </article>
                <article className="zelify-report-card">
                  <span>Edad Promedio del Cliente</span>
                  <strong>36.4 años</strong>
                </article>
              </div>

              <article className="zelify-report-card">
                <h3>Distribución por Zona Geográfica (Rural vs Urbana)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart layout="vertical" data={OUTREACH}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="zone" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1d4ed8" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>
            </>
          ) : null}

          {isIndicators || isDefault ? (
            <>
              {isDefault ? (
                <h2 style={{ margin: "6px 0 12px", fontSize: "1.1rem" }}>
                  {localizeText("Indicators / Indicadores", locale)}
                </h2>
              ) : null}
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card">
                  <span>{localizeText("Active Clients / Clientes Activos", locale)}</span>
                  <strong>12,420</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("Active Loans / Préstamos Activos", locale)}</span>
                  <strong>8,215</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("Transactions MTD / Transacciones MTD", locale)}</span>
                  <strong>284,901</strong>
                </article>
              </div>

              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>{localizeText("Operational Indicators Trend / Tendencia de Indicadores Operativos", locale)}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={INDICATORS_TREND}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="activeClients" stroke="#2563eb" strokeWidth={2} />
                      <Line type="monotone" dataKey="activeLoans" stroke="#0f766e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>{localizeText("Report Preview (PDF) / Vista previa del reporte (PDF)", locale)}</h3>
                  <div className="zelify-report-pdf-preview">
                    <div className="zelify-report-pdf-preview__title">
                      {localizeText("Indicators Executive Summary / Resumen Ejecutivo de Indicadores", locale)}
                    </div>
                    <div className="zelify-report-pdf-preview__line" />
                    <div className="zelify-report-pdf-preview__line" />
                    <div className="zelify-report-pdf-preview__line short" />
                    <p className="zelify-report-pdf-preview__body">
                      {localizeText(
                        "This executive summary consolidates portfolio and commercial KPIs (active clients, loans, transaction volumes) versus prior periods and internal targets. It highlights material variances, early warning trends and branch-level outliers for leadership follow-up. / Este resumen ejecutivo consolida indicadores de cartera y comerciales (clientes activos, préstamos, volumen de transacciones) frente a periodos anteriores y metas internas. Destaca variaciones relevantes, tendencias de alerta temprana y desviaciones por sede para seguimiento de la dirección.",
                        locale
                      )}
                    </p>
                    <div className="zelify-report-pdf-preview__meta">
                      {localizeText("Generated: 2026-04-20 09:45 UTC / Generado: 2026-04-20 09:45 UTC", locale)}
                    </div>
                  </div>
                </article>
              </div>
            </>
          ) : null}

          {isEarnings || isDefault ? (
            <>
              {isDefault ? (
                <h2 style={{ margin: "14px 0 12px", fontSize: "1.1rem" }}>
                  {localizeText("Earnings / Ganancias", locale)}
                </h2>
              ) : null}
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card">
                  <span>{localizeText("Interest Income (MTD) / Ingreso por Intereses (MTD)", locale)}</span>
                  <strong>$556K</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("Fee Income (MTD) / Ingreso por Comisiones (MTD)", locale)}</span>
                  <strong>$153K</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("Net Earnings (MTD) / Ganancia Neta (MTD)", locale)}</span>
                  <strong>$314K</strong>
                </article>
              </div>

              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>{localizeText("Earnings Breakdown / Desglose de Ganancias", locale)}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={EARNINGS_BREAKDOWN}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="interestIncome" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="feeIncome" fill="#0891b2" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="operatingExpense" fill="#f97316" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>{localizeText("P&L Data Snapshot / Resumen de Datos P&G", locale)}</h3>
                  <table className="zelify-report-table">
                    <thead>
                      <tr>
                        <th>{localizeText("Month / Mes", locale)}</th>
                        <th>{localizeText("Revenue / Ingreso", locale)}</th>
                        <th>{localizeText("Expense / Gasto", locale)}</th>
                        <th>{localizeText("Net / Neto", locale)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {EARNINGS_BREAKDOWN.map((row) => {
                        const revenue = row.interestIncome + row.feeIncome;
                        const net = revenue - row.operatingExpense;
                        return (
                          <tr key={row.month}>
                            <td>{row.month}</td>
                            <td>${revenue}K</td>
                            <td>${row.operatingExpense}K</td>
                            <td>${net}K</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </article>
              </div>
            </>
          ) : null}

          {isRisk || isDefault ? (
            <>
              {isDefault ? (
                <h2 style={{ margin: "14px 0 12px", fontSize: "1.1rem" }}>
                  {localizeText("Risk / Riesgo", locale)}
                </h2>
              ) : null}
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card">
                  <span>PAR 30+</span>
                  <strong>2.8%</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("High Risk Accounts / Cuentas de Alto Riesgo", locale)}</span>
                  <strong>413</strong>
                </article>
                <article className="zelify-report-card">
                  <span>{localizeText("Provision Coverage / Cobertura de Provisiones", locale)}</span>
                  <strong>121%</strong>
                </article>
              </div>

              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>{localizeText("PAR Buckets / Tramos PAR", locale)}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={RISK_BUCKETS} dataKey="value" nameKey="bucket" outerRadius={95}>
                        {RISK_BUCKETS.map((_, i) => (
                          <Cell key={i} fill={["#22c55e", "#eab308", "#f97316", "#ef4444"][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </article>
                <article className="zelify-report-card">
                  <h3>{localizeText("Risk Score by Branch / Puntaje de Riesgo por Sede", locale)}</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={RISK_HEATMAP}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="branch" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="riskScore" stroke="#dc2626" fill="#fecaca" />
                    </AreaChart>
                  </ResponsiveContainer>
                </article>
              </div>

              <article className="zelify-report-card" style={{ marginTop: 12 }}>
                <h3>{localizeText("Risk Committee Pack (PDF Preview) / Pack Comité de Riesgo (Vista PDF)", locale)}</h3>
                <div className="zelify-report-pdf-preview">
                  <div className="zelify-report-pdf-preview__title">
                    {localizeText("Risk Committee - April / Comité de Riesgo - Abril", locale)}
                  </div>
                  <div className="zelify-report-pdf-preview__line" />
                  <div className="zelify-report-pdf-preview__line" />
                  <div className="zelify-report-pdf-preview__line" />
                  <p className="zelify-report-pdf-preview__body">
                    {localizeText(
                      "The April committee pack covers portfolio-at-risk (PAR) buckets, provisioning coverage versus expected credit losses and a branch heat map of delinquency and risk scores. It is intended to support decisions on limits, collections strategy and capital buffers. / El pack de abril del comité abarca tramos de cartera en riesgo (PAR), cobertura de provisiones frente a pérdidas crediticias esperadas y un mapa de calor por sede de mora y puntajes de riesgo. Está orientado a apoyar decisiones sobre límites, estrategia de cobranza y colchones de capital.",
                      locale
                    )}
                  </p>
                  <div className="zelify-report-pdf-preview__meta">
                    {localizeText(
                      "Includes PAR, provisioning and branch heat map / Incluye PAR, provisiones y mapa de calor por sede",
                      locale
                    )}
                  </div>
                </div>
              </article>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

