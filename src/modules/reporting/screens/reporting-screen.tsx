"use client";

import { useCallback, useState } from "react";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { formatMxnFull, formatMxnCompact } from "@/modules/scotia/utils/format-mxn";
import { resolveCreditReportFromPrompt } from "../data/credit-report-subjects";
import { exportCreditReportPdf } from "../services/credit-report-pdf";
import { KycCaptureCard } from "../components/kyc-capture-card";
import type { CreditReportPayload, CreditReportRuleRow } from "../types/credit-report.types";
import "@/components/ui/templates/workspace-page.css";
import "./reporting-screen.css";

const DEFAULT_PROMPT =
  "Generar reporte crediticio integral de JUAN FERNANDO MENDEZ ORTIZ con análisis KYC, AML, buró de crédito, reglas del motor CORTEX y capacidad de pago";

function verdictTone(v: CreditReportRuleRow["verdict"]): "success" | "warning" | "danger" {
  if (v === "CUMPLE") return "success";
  if (v === "REVISAR") return "warning";
  return "danger";
}

function groupLabel(g: CreditReportRuleRow["group"]) {
  if (g === "aprobacion") return "Aprobación";
  if (g === "pricing") return "Pricing";
  return "Validación";
}

export function ReportingScreen() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<CreditReportPayload | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setReport(resolveCreditReportFromPrompt(prompt));
    setLoading(false);
  }, [prompt]);

  const exportPdf = () => {
    if (!report) return;
    exportCreditReportPdf(report);
  };

  const s = report?.subject;

  return (
    <div className="zelify-workspace-page rpt-root">
      <ZelifyTopNavbar activeNavId="reporting" />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner rpt-inner">
          <header className="rpt-head">
            <div>
              <AppBadge tone="neutral">CORTEX · Reporting</AppBadge>
              <h1 className="zelify-workspace-page__title">Informes crediticios</h1>
              <p className="rpt-head__sub">
                Análisis integral KYC · AML · Buró · Motor de decisión · Capacidad de pago
              </p>
            </div>
            {report && (
              <div className="rpt-head__folio">
                <span>Folio</span>
                <strong>{report.reportId}</strong>
                <span>{new Date(report.generatedAt).toLocaleString("es-MX")}</span>
              </div>
            )}
          </header>

          <section className="rpt-prompt-card">
            <label htmlFor="rpt-prompt">Consulta en lenguaje natural</label>
            <AppInput
              id="rpt-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe el reporte crediticio que necesitas..."
            />
            <div className="rpt-prompt-card__actions">
              <AppButton tone="primary" onClick={() => void generate()} disabled={loading}>
                {loading ? "Procesando consulta…" : "Generar informe"}
              </AppButton>
              <AppButton tone="secondary" onClick={exportPdf} disabled={!report}>
                Descargar PDF
              </AppButton>
            </div>
          </section>

          {loading && (
            <div className="rpt-loading">
              <div className="rpt-loading__spinner" />
              <p>Consultando buró · validando listas AML · ejecutando motor CORTEX…</p>
            </div>
          )}

          {report && s && !loading && (
            <div className="rpt-preview">
              {/* Dictamen */}
              <section className="rpt-panel rpt-panel--hero">
                <div className="rpt-panel__head">
                  <h2>Dictamen crediticio</h2>
                  <AppBadge tone={s.decision === "APROBADO" ? "success" : "warning"}>{s.decision}</AppBadge>
                </div>
                <div className="rpt-hero-grid">
                  <div>
                    <h3>{s.fullName}</h3>
                    <p>{s.curp} · {s.rfc}</p>
                    <p className="rpt-muted">{s.address}</p>
                  </div>
                  <div className="rpt-kpi-row">
                    <div><span>Producto</span><strong>{s.productName}</strong></div>
                    <div><span>Monto</span><strong>{formatMxnFull(s.requestedAmount)}</strong></div>
                    <div><span>Plazo</span><strong>{s.termMonths} meses</strong></div>
                    <div><span>Tasa final</span><strong>{s.finalRate}%</strong></div>
                    <div><span>Cuota</span><strong>{formatMxnFull(s.monthlyPayment)}</strong></div>
                    <div><span>BC Score</span><strong className="rpt-val-up">{s.buroScore}</strong></div>
                  </div>
                </div>
                <p className="rpt-summary">{s.decisionSummary}</p>
              </section>

              {/* Resumen ejecutivo */}
              <section className="rpt-panel">
                <h2>Resumen ejecutivo</h2>
                <ul className="rpt-bullets">
                  {report.executiveSummary.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </section>

              {/* KYC */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>KYC · Verificación de identidad</h2>
                  <AppBadge tone="success">{s.kycStatus}</AppBadge>
                </div>
                <div className="rpt-subject-grid">
                  <div><span>Email</span><strong>{s.email}</strong></div>
                  <div><span>Celular</span><strong>{s.phone}</strong></div>
                  <div><span>Nacimiento</span><strong>{s.birthDate}</strong></div>
                  <div><span>Nacionalidad</span><strong>{s.nationality}</strong></div>
                  <div><span>INE</span><strong>{s.ine}</strong></div>
                  <div><span>Score IA identidad</span><strong>{s.aiScore}/100</strong></div>
                </div>
                <p className="rpt-section-hint">Capturas biométricas y documentales · sesión del 22 may 2026</p>
                <div className="rpt-kyc-grid">
                  {report.kycCaptures.map((c) => (
                    <KycCaptureCard key={c.id} capture={c} subjectName={s.fullName} curp={s.curp} />
                  ))}
                </div>
              </section>

              {/* AML */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>AML · Listas restrictivas</h2>
                  <AppBadge tone="success">{s.amlStatus}</AppBadge>
                </div>
                <p className="rpt-section-hint">
                  Screening simultáneo contra listas nacionales e internacionales · PEP: {s.pep ? "Identificado" : "No identificado"}
                </p>
                <table className="rpt-tbl">
                  <thead>
                    <tr>
                      <th>Lista</th>
                      <th>Proveedor</th>
                      <th>Resultado</th>
                      <th>Consulta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.amlChecks.map((a) => (
                      <tr key={a.listName}>
                        <td><strong>{a.listName}</strong></td>
                        <td>{a.provider}</td>
                        <td><span className="rpt-pill rpt-pill--ok">Sin coincidencias</span></td>
                        <td className="rpt-muted">{new Date(a.checkedAt).toLocaleString("es-MX")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Buró */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>Buró de Crédito</h2>
                  <span className="rpt-buro-score">{s.buroScore}</span>
                </div>
                <div className="rpt-kpi-row rpt-kpi-row--4">
                  <div><span>Percentil nacional</span><strong>{s.buroPercentile}</strong></div>
                  <div><span>Antigüedad crediticia</span><strong>{Math.floor(s.creditAgeMonths / 12)}a {s.creditAgeMonths % 12}m</strong></div>
                  <div><span>Consultas 6 meses</span><strong>{s.inquiries6m}</strong></div>
                  <div><span>Deuda reportada</span><strong>{formatMxnCompact(s.totalDebt)}</strong></div>
                  <div><span>MOP máximo</span><strong>{s.maxMop}</strong></div>
                </div>
                <table className="rpt-tbl">
                  <thead>
                    <tr>
                      <th>Acreditante</th>
                      <th>Producto</th>
                      <th>Saldo</th>
                      <th>Límite</th>
                      <th>MOP</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.buroTradelines.map((t) => (
                      <tr key={t.creditor + t.product}>
                        <td><strong>{t.creditor}</strong></td>
                        <td>{t.product}</td>
                        <td className="rpt-n">{formatMxnFull(t.balance)}</td>
                        <td className="rpt-n">{formatMxnFull(t.limit)}</td>
                        <td><span className="rpt-pill rpt-pill--ok">{t.mop}</span></td>
                        <td>{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* Motor CORTEX */}
              <section className="rpt-panel">
                <div className="rpt-panel__head">
                  <h2>Motor CORTEX · Reglas de decisión</h2>
                  <span className="rpt-muted">{s.productId} · {s.productCategory}</span>
                </div>
                <div className="rpt-rules-groups">
                  {(["aprobacion", "validacion", "pricing"] as const).map((group) => (
                    <div key={group} className="rpt-rules-group">
                      <h3>{groupLabel(group)}</h3>
                      <ul>
                        {report.rules.filter((r) => r.group === group).map((r) => (
                          <li key={r.id} className={`rpt-rule rpt-rule--${verdictTone(r.verdict)}`}>
                            <div className="rpt-rule__top">
                              <strong>{r.label}</strong>
                              <span>{r.verdict}</span>
                            </div>
                            <p>{r.detail}</p>
                            {r.bpsDiscount ? (
                              <span className="rpt-rule__bps">−{r.bpsDiscount} pbs</span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                <div className="rpt-rate-cascade">
                  <span>Tasa base {s.baseRate}%</span>
                  <span>→</span>
                  <span>Descuentos nómina + TDC + eco (−125 pbs)</span>
                  <span>→</span>
                  <strong>Tasa final {s.finalRate}%</strong>
                </div>
              </section>

              {/* Capacidad de pago */}
              <section className="rpt-panel">
                <h2>Capacidad de pago e ingresos</h2>
                <div className="rpt-capacity-grid">
                  <article className="rpt-capacity-card">
                    <span>Ingreso neto verificado</span>
                    <strong>{formatMxnFull(s.incomeNetMonthly)}</strong>
                    <p>{s.employer} · {s.employmentYears} años antigüedad</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Cuota mensual propuesta</span>
                    <strong>{formatMxnFull(s.monthlyPayment)}</strong>
                    <p>Relación cuota/ingreso {report.capacity.paymentToIncome}%</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Ingreso disponible</span>
                    <strong>{formatMxnFull(report.capacity.disposableIncome)}</strong>
                    <p>Post cuota y obligaciones fijas</p>
                  </article>
                  <article className="rpt-capacity-card">
                    <span>Endeudamiento (DTI)</span>
                    <strong>{report.capacity.debtToIncome}%</strong>
                    <p>Máx. exposición {formatMxnFull(report.capacity.maxLoanByIncome)}</p>
                  </article>
                </div>
                <div className="rpt-gauge">
                  <div className="rpt-gauge__bar">
                    <div
                      className="rpt-gauge__fill"
                      style={{ width: `${Math.min(report.capacity.paymentToIncome / report.capacity.maxAllowedPti * 100, 100)}%` }}
                    />
                  </div>
                  <span>
                    Capacidad de pago: {report.capacity.paymentToIncome}% de {report.capacity.maxAllowedPti}% permitido
                  </span>
                </div>
                <p className="rpt-ai-note">
                  <strong>CORTEX-Recommend:</strong> {s.aiRecommendation}
                </p>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
