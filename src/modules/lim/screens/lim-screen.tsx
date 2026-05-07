"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppSelect } from "@/components/ui/atoms/select/app-select";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./lim-screen.css";

type ScenarioId = "withdrawal" | "repricing" | "liquidity";

type PipelinePhase =
  | "idle"
  | "ingest"
  | "quality"
  | "analytics"
  | "insights"
  | "workflow"
  | "done";

const SCENARIOS: Record<
  ScenarioId,
  {
    label: string;
    ingestLines: string[];
    analyticsHint: string;
    insightTitle: string;
    insightBody: string;
    alertTone: "success" | "warning" | "neutral";
    workflowPrimary: string;
    workflowSecondary: string;
    /** Valores 0–100 para mini-gráfico de “índice de saldo” */
    balanceSeries: number[];
    /** Barras comparativas (repricing) */
    spreadBars: { label: string; value: number }[];
    /** Colchón de liquidez % proyectado T+30/60/90 */
    cushionSeries: number[];
  }
> = {
  withdrawal: {
    label: "Salida atípica de depósitos (multi-sede)",
    ingestLines: [
      "batch: balances diarios consolidados (MXN, USD) ✓",
      "stream: tx depósito/retiro últimos 15 min ✓",
      "pricing histórico plazo fijo (últimos 90d) ✓",
      "atributos cliente: segmento, antigüedad, canal ✓",
    ],
    analyticsHint:
      "Modelo de comportamiento detecta cluster con retiros >2σ vs baseline semanal por producto y sede.",
    insightTitle: "Señal: riesgo de salida concentrada",
    insightBody:
      "Segmento PYME · Plazo · Región Norte muestra caída de saldo acumulada ~8% en 48h vs tendencia. Recomendación sugerida (no ejecutada): campaña de retención prioritaria + revisión de oferta competitiva.",
    alertTone: "warning",
    workflowPrimary: "Tesorería — cola “stress liquidez regional” (solo revisión; sin movimiento de fondos)",
    workflowSecondary: "Comercial — “next best action” leads alto valor (enrutado a CRM; sin repricing automático)",
    balanceSeries: [100, 96, 91, 88, 85, 84],
    spreadBars: [
      { label: "Spread vigente", value: 42 },
      { label: "Competencia (proxy)", value: 55 },
    ],
    cushionSeries: [78, 72, 68],
  },
  repricing: {
    label: "Oportunidad de repricing segmentado",
    ingestLines: [
      "batch: books de tasas vigentes + competencia proxy ✓",
      "near real-time: volumen y costo de fondeo por tramo ✓",
      "histórico: spreads por producto y cupo ✓",
    ],
    analyticsHint:
      "Detección de elasticidad estimada y margen neto proyectado por cohorte (framework; la tasa final la define el banco).",
    insightTitle: "Escenario: repricing selectivo rentable",
    insightBody:
      "Cohortes retail plazo 90–180d toleran +15 bps sin churn proyectado crítico según modelo sandbox. Salida: matriz de escenarios para comité (API), no aplicación en core.",
    alertTone: "success",
    workflowPrimary: "Pricing / ALCO — tarea “evaluar escenarios LIM-042”",
    workflowSecondary: "Comercial — lista corta de clientes para propuesta (export BI)",
    balanceSeries: [100, 100, 101, 102, 102, 103],
    spreadBars: [
      { label: "Margen neto (base)", value: 48 },
      { label: "Escenario +15 bps", value: 62 },
    ],
    cushionSeries: [82, 79, 76],
  },
  liquidity: {
    label: "Forecast de liquidez y escenario adverso",
    ingestLines: [
      "batch: saldos consolidados multi-entidad ✓",
      "proyección cashflow entrada/salida 30/60/90d ✓",
      "eventos macro / festivos / seasonality ✓",
    ],
    analyticsHint:
      "Motor de escenarios simula brecha de liquidez bajo stress moderado; ranking de palancas (solo informativo).",
    insightTitle: "Alerta temprana: brecha proyectada bajo escenario B",
    insightBody:
      "En escenario B (retiros +3pp, nuevo funding +50M), LIM proyecta uso cercano al límite operativo de colchón en T+18. Output: briefing + triggers a workflow; sin operaciones automáticas.",
    alertTone: "warning",
    workflowPrimary: "Tesorería — alerta “LIM-LIQ-URG” + checklist documentado",
    workflowSecondary: "ALCO — sesión breve sugerida (calendario externo)",
    balanceSeries: [100, 97, 93, 89, 86, 82],
    spreadBars: [
      { label: "Colchón mínimo reglamentario", value: 100 },
      { label: "Proyección T+18", value: 94 },
    ],
    cushionSeries: [72, 58, 44],
  },
};

const PHASE_ORDER: Exclude<PipelinePhase, "idle">[] = [
  "ingest",
  "quality",
  "analytics",
  "insights",
  "workflow",
  "done",
];

const FLOW_STEPS: { phase: Exclude<PipelinePhase, "idle">; label: string; abbr: string }[] = [
  { phase: "ingest", label: "Ingesta", abbr: "IN" },
  { phase: "quality", label: "Calidad", abbr: "DQ" },
  { phase: "analytics", label: "Analytics / IA", abbr: "A" },
  { phase: "insights", label: "Insights", abbr: "I" },
  { phase: "workflow", label: "Workflow", abbr: "WF" },
  { phase: "done", label: "Listo", abbr: "✓" },
];

function phaseLabelFromIndex(stepIndex: number): string {
  if (stepIndex < 0) return "Listo para iniciar";
  const map: Record<PipelinePhase, string> = {
    idle: "Listo",
    ingest: "Ingesta de datos",
    quality: "Calidad y linaje",
    analytics: "Analytics & AI (marco)",
    insights: "Decisioning & insights",
    workflow: "Orquestación de workflows",
    done: "Flujo completado",
  };
  const p = PHASE_ORDER[stepIndex];
  return map[p];
}

function buildLogLinesThroughStep(scenario: ScenarioId, maxIdx: number): string[] {
  const cfg = SCENARIOS[scenario];
  const lines: string[] = [];
  for (let i = 0; i <= maxIdx; i += 1) {
    const current = PHASE_ORDER[i];
    if (current === "ingest") {
      lines.push(...cfg.ingestLines.map((l) => `[ingesta] ${l}`));
    } else if (current === "quality") {
      lines.push("[calidad] DQ: completitud 99.2% · duplicados 0 · lineage hasta core contable");
    } else if (current === "analytics") {
      lines.push(`[analytics] ${cfg.analyticsHint}`);
    } else if (current === "insights") {
      lines.push(`[insights] ${cfg.insightTitle}`, `[insights] ${cfg.insightBody}`);
    } else if (current === "workflow") {
      lines.push(
        "[workflow] Evento LIM_TRIP · enrutamiento inteligente (sin ejecución financiera)",
        `[workflow] → ${cfg.workflowPrimary}`,
        `[workflow] → ${cfg.workflowSecondary}`,
      );
    } else if (current === "done") {
      lines.push("[done] LIM orquestó la decisión; el banco ejecuta fuera de esta capa.");
    }
  }
  return lines;
}

function LimArchitectureOverview() {
  return (
    <div className="zelify-lim-arch">
      <p className="zelify-lim-arch__caption">Vista lógica: overlay de inteligencia (sin sustituir el core)</p>
      <svg className="zelify-lim-arch__svg" viewBox="0 0 640 200" role="img" aria-label="Core bancario, capa LIM y canales">
        <defs>
          <linearGradient id="limGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.22" />
          </linearGradient>
        </defs>
        <rect x="24" y="40" width="160" height="120" rx="12" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
        <text x="104" y="92" textAnchor="middle" className="zelify-lim-arch__txt" fontSize="13" fontWeight="700" fill="#0f172a">
          Core bancario
        </text>
        <text x="104" y="116" textAnchor="middle" className="zelify-lim-arch__txt" fontSize="11" fill="#64748b">
          Ledger · productos
        </text>
        <rect x="220" y="24" width="200" height="152" rx="14" fill="url(#limGrad)" stroke="#1d4ed8" strokeWidth="2" strokeDasharray="6 4" />
        <text x="320" y="56" textAnchor="middle" className="zelify-lim-arch__txt" fontSize="14" fontWeight="800" fill="#1e3a8a">
          LIM
        </text>
        <text x="320" y="78" textAnchor="middle" className="zelify-lim-arch__txt" fontSize="11" fill="#4338ca">
          datos · señales · workflows
        </text>
        <line x1="184" y1="100" x2="216" y2="100" stroke="#1d4ed8" strokeWidth="2" />
        <polygon points="214,96 222,100 214,104" fill="#1d4ed8" />
        <rect x="260" y="96" width="56" height="28" rx="6" fill="#fff" stroke="#818cf8" />
        <text x="288" y="114" textAnchor="middle" fontSize="9" fill="#3730a3">
          DQ
        </text>
        <rect x="330" y="96" width="56" height="28" rx="6" fill="#fff" stroke="#818cf8" />
        <text x="358" y="114" textAnchor="middle" fontSize="9" fill="#3730a3">
          IA
        </text>
        <rect x="400" y="96" width="56" height="28" rx="6" fill="#fff" stroke="#818cf8" />
        <text x="428" y="114" textAnchor="middle" fontSize="9" fill="#3730a3">
          WF
        </text>
        <text x="320" y="150" textAnchor="middle" fontSize="10" fill="#4f46e5">
          Orquesta · no ejecuta cash
        </text>
        <rect x="456" y="48" width="160" height="104" rx="12" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
        <text x="536" y="88" textAnchor="middle" className="zelify-lim-arch__txt" fontSize="12" fontWeight="700" fill="#065f46">
          Tesorería
        </text>
        <text x="536" y="108" textAnchor="middle" fontSize="11" fill="#047857">
          Comercial
        </text>
        <text x="536" y="128" textAnchor="middle" fontSize="10" fill="#059669">
          BI / CRM
        </text>
        <line x1="420" y1="100" x2="456" y2="88" stroke="#10b981" strokeWidth="1.5" />
        <line x1="420" y1="108" x2="456" y2="108" stroke="#10b981" strokeWidth="1.5" />
        <line x1="420" y1="116" x2="456" y2="128" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
      </svg>
    </div>
  );
}

function LimPipelineRail({
  stepIndex,
  isPlaying,
  onJumpTo,
}: {
  stepIndex: number;
  isPlaying: boolean;
  onJumpTo: (idx: number) => void;
}) {
  return (
    <div className="zelify-lim-rail" aria-label="Etapas del pipeline LIM">
      {FLOW_STEPS.map((s, idx) => {
        let state: "todo" | "current" | "done" = "todo";
        if (stepIndex < 0) state = "todo";
        else if (idx < stepIndex) state = "done";
        else if (idx === stepIndex) state = "current";
        else state = "todo";
        return (
          <div key={s.phase} className="zelify-lim-rail__slot">
            <button
              type="button"
              className={`zelify-lim-node zelify-lim-node--${state} ${isPlaying && state === "current" ? "zelify-lim-node--pulse" : ""}`}
              onClick={() => onJumpTo(idx)}
              disabled={isPlaying || (stepIndex < 0 && idx > 0)}
              title={stepIndex < 0 && idx === 0 ? "Iniciar desde ingesta" : `Ir a ${s.label}`}
            >
              <span className="zelify-lim-node__abbr">{s.abbr}</span>
              <span className="zelify-lim-node__lbl">{s.label}</span>
            </button>
            {idx < FLOW_STEPS.length - 1 ? (
              <div
                className={`zelify-lim-rail__conn ${idx < stepIndex ? "is-done" : ""} ${idx === stepIndex ? "is-active" : ""}`}
                aria-hidden
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function LimScenarioCharts({
  scenario,
  stepIndex,
}: {
  scenario: ScenarioId;
  stepIndex: number;
}) {
  const cfg = SCENARIOS[scenario];
  const lineData = cfg.balanceSeries;
  const maxLine = Math.max(...lineData, 1);
  const reveal = stepIndex >= 2;

  return (
    <div className="zelify-lim-charts">
      <div className="zelify-lim-charts__head">
        <span>Señales visuales (demo)</span>
        <AppBadge tone={cfg.alertTone} size="sm">
          {scenario === "withdrawal" ? "Énfasis saldos" : scenario === "repricing" ? "Énfasis spreads" : "Énfasis liquidez"}
        </AppBadge>
      </div>
      <div className="zelify-lim-chartbox">
          <p className="zelify-lim-chartbox__t">
            {scenario === "withdrawal"
              ? "Evolución del índice de saldo (normalizado)"
              : scenario === "repricing"
                ? "Índice de saldo / fondeo (proxy)"
                : "Trayectoria de base líquida (proxy)"}
          </p>
          <div className="zelify-lim-spark">
            <svg viewBox={`0 0 ${lineData.length * 40} 80`} preserveAspectRatio="none" className="zelify-lim-spark__svg">
              <polyline
                fill="none"
                stroke={scenario === "withdrawal" ? "#dc2626" : "#2563eb"}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={lineData
                  .map((v, i) => {
                    const x = i * 40 + 8;
                    const y = 72 - (v / maxLine) * 56;
                    return `${x},${y}`;
                  })
                  .join(" ")}
                opacity={reveal ? 1 : 0.25}
              />
              {lineData.map((v, i) => (
                <circle
                  key={i}
                  cx={i * 40 + 8}
                  cy={72 - (v / maxLine) * 56}
                  r={reveal ? 4 : 2}
                  fill={scenario === "withdrawal" ? "#ef4444" : "#3b82f6"}
                  opacity={reveal ? 1 : 0.35}
                />
              ))}
            </svg>
          </div>
          {!reveal ? <p className="zelify-lim-chartbox__hint">Avanza hasta Analytics para animar la serie.</p> : null}
        </div>
      <div className="zelify-lim-chartbox">
        <p className="zelify-lim-chartbox__t">Comparación (spread / colchón / competencia)</p>
        <div className="zelify-lim-bars">
          {cfg.spreadBars.map((b) => (
            <div key={b.label} className="zelify-lim-bars__row">
              <span className="zelify-lim-bars__lab">{b.label}</span>
              <div className="zelify-lim-bars__track">
                <div
                  className="zelify-lim-bars__fill"
                  style={{
                    width: `${stepIndex >= 3 ? b.value : Math.min(b.value, 28)}%`,
                    background: b.label.includes("Competencia") || b.label.includes("Proyección") ? "#f59e0b" : "#1d4ed8",
                  }}
                />
              </div>
              <span className="zelify-lim-bars__pct">{stepIndex >= 3 ? `${b.value}%` : "—"}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="zelify-lim-chartbox">
        <p className="zelify-lim-chartbox__t">Colchón / horizonte (T+30 · T+60 · T+90)</p>
        <div className="zelify-lim-horiz">
          {cfg.cushionSeries.map((c, i) => (
            <div key={i} className="zelify-lim-horiz__col">
              <div
                className="zelify-lim-horiz__bar"
                style={{
                  height: `${stepIndex >= 4 ? c : Math.min(c, 40)}%`,
                  background: c < 50 ? "#ef4444" : c < 70 ? "#f59e0b" : "#10b981",
                }}
              />
              <span className="zelify-lim-horiz__lbl">{i === 0 ? "T+30" : i === 1 ? "T+60" : "T+90"}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LimRoutingDeck({
  stepIndex,
  primary,
  secondary,
  scenario,
}: {
  stepIndex: number;
  primary: string;
  secondary: string;
  scenario: ScenarioId;
}) {
  const lit = stepIndex >= 4;
  const showAlco = scenario === "liquidity" || scenario === "repricing";
  return (
    <div className="zelify-lim-route">
      <p className="zelify-lim-route__title">Enrutamiento (sin ejecución en core)</p>
      <div className="zelify-lim-route__grid">
        <div className={`zelify-lim-route__card ${lit ? "is-lit" : ""}`}>
          <span className="zelify-lim-route__icon" aria-hidden>
            🏦
          </span>
          <strong>Tesorería / Liquidez</strong>
          <p>{primary}</p>
        </div>
        <div className={`zelify-lim-route__card ${lit ? "is-lit" : ""}`}>
          <span className="zelify-lim-route__icon" aria-hidden>
            📣
          </span>
          <strong>Comercial / CRM</strong>
          <p>{secondary}</p>
        </div>
        {showAlco ? (
          <div className={`zelify-lim-route__card ${lit ? "is-lit" : ""}`}>
            <span className="zelify-lim-route__icon" aria-hidden>
              📊
            </span>
            <strong>ALCO / Pricing</strong>
            <p>{scenario === "liquidity" ? "Briefing de escenario B adjunto al workflow." : "Matriz de escenarios en BI."}</p>
          </div>
        ) : null}
      </div>
      <div className="zelify-lim-route__corewall">
        <span className="zelify-lim-route__wall" />
        Core bancario — sin instrucciones automáticas de movimiento
      </div>
    </div>
  );
}

export function LimScreen() {
  const [tab, setTab] = useState<"resumen" | "simulador" | "zelify">("resumen");
  const [scenario, setScenario] = useState<ScenarioId>("withdrawal");
  const [stepIndex, setStepIndex] = useState(-1);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = SCENARIOS[scenario];

  const stopTimer = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  const resetSimulation = useCallback(() => {
    stopTimer();
    setStepIndex(-1);
    setLogLines([]);
  }, [stopTimer]);

  const goToStep = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= PHASE_ORDER.length) return;
      stopTimer();
      setStepIndex(idx);
      setLogLines(buildLogLinesThroughStep(scenario, idx));
    },
    [scenario, stopTimer],
  );

  const nextManualStep = useCallback(() => {
    if (isPlaying) return;
    if (stepIndex >= PHASE_ORDER.length - 1) return;
    const next = stepIndex < 0 ? 0 : stepIndex + 1;
    goToStep(next);
  }, [goToStep, isPlaying, stepIndex]);

  const runAuto = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStepIndex(0);
    setLogLines(buildLogLinesThroughStep(scenario, 0));
    setIsPlaying(true);
    let idx = 0;
    timerRef.current = setInterval(() => {
      idx += 1;
      if (idx >= PHASE_ORDER.length) {
        stopTimer();
        return;
      }
      setStepIndex(idx);
      setLogLines(buildLogLinesThroughStep(scenario, idx));
      if (PHASE_ORDER[idx] === "done") {
        stopTimer();
      }
    }, 900);
  }, [scenario, stopTimer]);

  const canChangeScenario = !isPlaying && (stepIndex < 0 || stepIndex === PHASE_ORDER.length - 1);
  const progressPct = stepIndex < 0 ? 0 : Math.round(((stepIndex + 1) / PHASE_ORDER.length) * 100);

  const insightVisible = stepIndex >= 3;

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />
      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner zelify-lim-wrap">
          <h1 className="zelify-workspace-page__title">LIM — Liquidity Intelligence & Management</h1>

          <div className="zelify-lim-tabs" role="tablist">
            <button type="button" className={tab === "resumen" ? "is-active" : ""} onClick={() => setTab("resumen")}>
              Resumen del servicio
            </button>
            <button type="button" className={tab === "simulador" ? "is-active" : ""} onClick={() => setTab("simulador")}>
              Simulador de flujo
            </button>
            <button type="button" className={tab === "zelify" ? "is-active" : ""} onClick={() => setTab("zelify")}>
              Zelify ↔ LIM
            </button>
          </div>

          {tab === "resumen" ? (
            <>
              <section className="zelify-lim-hero">
                <h2>Capa de inteligencia sobre el core</h2>
                <p>
                  LIM convierte la gestión de liquidez y depósitos de un modelo manual, reactivo y fragmentado en uno
                  dinámico, en tiempo real y basado en analítica avanzada e IA — sin reemplazar el core bancario.
                </p>
                <LimArchitectureOverview />
                <div className="zelify-lim-grid-2">
                  <div className="zelify-lim-card">
                    <h3>Objetivo central</h3>
                    <ul>
                      <li>Consolidar datos multi-producto, multi-moneda y multi-entidad.</li>
                      <li>Generar insights accionables y escenarios.</li>
                      <li>Habilitar decisiones más precisas en liquidez, pricing y crecimiento.</li>
                    </ul>
                  </div>
                  <div className="zelify-lim-card">
                    <h3>Principio clave</h3>
                    <ul>
                      <li>
                        <strong>LIM orquesta decisiones; no ejecuta operaciones financieras.</strong>
                      </li>
                      <li>Modelos y decisión final en el banco.</li>
                      <li>Proveedor habilita infraestructura, datos y marcos — no el “cerebro final”.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <div className="zelify-lim-grid-2">
                <div className="zelify-lim-card">
                  <h3>A. Arquitectura</h3>
                  <ul>
                    <li>Capa desacoplada (overlay) sobre sistemas existentes.</li>
                    <li>Microservicios, cloud-ready, escalable por país/producto/segmento.</li>
                    <li>MVP modular con expansión gradual.</li>
                  </ul>
                </div>
                <div className="zelify-lim-card">
                  <h3>B. Data layer</h3>
                  <ul>
                    <li>Ingesta batch + near real-time.</li>
                    <li>Fuentes: balances, transacciones, pricing histórico, atributos de cliente.</li>
                    <li>Pipelines robustos, calidad de datos y linaje (lineage).</li>
                  </ul>
                </div>
                <div className="zelify-lim-card">
                  <h3>C. Analytics &amp; AI</h3>
                  <ul>
                    <li>Comportamiento de depósitos, segmentación dinámica, detección de cambios.</li>
                    <li>Marcos y señales; las decisiones finales quedan en el banco.</li>
                  </ul>
                </div>
                <div className="zelify-lim-card">
                  <h3>D. Decisioning &amp; insights</h3>
                  <ul>
                    <li>Recomendaciones, alertas tempranas, escenarios.</li>
                    <li>Integración con tesorería, comercial y herramientas existentes.</li>
                  </ul>
                </div>
                <div className="zelify-lim-card">
                  <h3>E. Visualización</h3>
                  <ul>
                    <li>Dashboards ejecutivos y operativos.</li>
                    <li>Exportación a BI, CRM y herramientas de pricing.</li>
                  </ul>
                </div>
                <div className="zelify-lim-card">
                  <h3>F. Seguridad y gobierno</h3>
                  <ul>
                    <li>Control por roles, auditabilidad.</li>
                    <li>Separación clara: proveedor (infra) / banco (decisiones).</li>
                  </ul>
                </div>
              </div>

              <div className="zelify-lim-card" style={{ marginTop: 12 }}>
                <h3>G. Workflows (valor central)</h3>
                <ul>
                  <li>
                    <strong>Transactional:</strong> onboarding, repricing, renovaciones.
                  </li>
                  <li>
                    <strong>Commercial:</strong> leads, campañas, next best action.
                  </li>
                  <li>
                    <strong>Analytical:</strong> forecasting, escenarios de liquidez.
                  </li>
                  <li>
                    <strong>Orquestación:</strong> motor de workflows, eventos y triggers, routing inteligente, trazabilidad.
                  </li>
                </ul>
              </div>

              <div className="zelify-lim-disclaimer">
                Lectura estratégica: el cliente busca un constructor de la capa tecnológica (tipo “inteligencia para
                liquidez”), no un sustituto del core ni un dictado de política de precios.
              </div>
            </>
          ) : null}

          {tab === "simulador" ? (
            <>
              <div className="zelify-lim-simtop">
                <div className="zelify-lim-card zelify-lim-card--grow">
                  <h3>Simulación interactiva end-to-end</h3>
                  <p className="zelify-lim-lead">
                    Usa <strong>reproducción automática</strong> o <strong>siguiente paso</strong>. El rail muestra en qué etapa va el pipeline; a la
                    derecha, gráficos y enrutamiento reaccionan al avanzar.
                  </p>
                  <div className="zelify-lim-toolbar">
                    <div className="zelify-lim-toolbar__field">
                      <label htmlFor="lim-scenario">Escenario</label>
                      <AppSelect
                        id="lim-scenario"
                        value={scenario}
                        onChange={(e) => {
                          resetSimulation();
                          setScenario(e.target.value as ScenarioId);
                        }}
                        disabled={!canChangeScenario}
                      >
                        <option value="withdrawal">{SCENARIOS.withdrawal.label}</option>
                        <option value="repricing">{SCENARIOS.repricing.label}</option>
                        <option value="liquidity">{SCENARIOS.liquidity.label}</option>
                      </AppSelect>
                    </div>
                    <AppButton tone="primary" onClick={runAuto} disabled={isPlaying}>
                      {isPlaying ? "Reproduciendo…" : "▶ Automático"}
                    </AppButton>
                    <AppButton tone="secondary" onClick={nextManualStep} disabled={isPlaying || stepIndex >= PHASE_ORDER.length - 1}>
                      Siguiente paso
                    </AppButton>
                    <AppButton tone="neutral" onClick={resetSimulation} disabled={isPlaying}>
                      Reiniciar
                    </AppButton>
                    <AppBadge tone={cfg.alertTone} size="sm">
                      Demo
                    </AppBadge>
                  </div>
                  <div className="zelify-lim-progress-wrap">
                    <div className="zelify-lim-progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPct}>
                      <div className="zelify-lim-progress__fill" style={{ width: `${progressPct}%` }} />
                    </div>
                    <span className="zelify-lim-progress__lbl">
                      {phaseLabelFromIndex(stepIndex)} · {progressPct}%
                    </span>
                  </div>
                  <LimPipelineRail stepIndex={stepIndex} isPlaying={isPlaying} onJumpTo={goToStep} />
                </div>
              </div>

              <div className="zelify-lim-simgrid">
                <LimScenarioCharts scenario={scenario} stepIndex={stepIndex} />
                <LimRoutingDeck stepIndex={stepIndex} primary={cfg.workflowPrimary} secondary={cfg.workflowSecondary} scenario={scenario} />
              </div>

              <div className="zelify-lim-step">
                <h4>Registro del pipeline (consola)</h4>
                <div className="zelify-lim-log" role="log">
                  {logLines.length === 0 ? (
                    <span className="muted">Pulsa “Automático” o “Siguiente paso” para llenar el log.</span>
                  ) : (
                    logLines.map((line, i) => (
                      <div key={`${i}-${line.slice(0, 28)}`}>{line.startsWith("[done]") ? <span className="ok">{line}</span> : line}</div>
                    ))
                  )}
                </div>
              </div>

              {insightVisible ? (
                <div className="zelify-lim-card zelify-lim-insight">
                  <h3>Vista de insights</h3>
                  <p className="zelify-lim-insight__title">{cfg.insightTitle}</p>
                  <p className="zelify-lim-insight__body">{cfg.insightBody}</p>
                </div>
              ) : null}

              <div className="zelify-lim-disclaimer">
                <strong>Importante:</strong> gráficos y enrutamiento son ilustrativos para la demo. No hay ejecución
                real de órdenes ni cambios en el core.
              </div>
            </>
          ) : null}

          {tab === "zelify" ? (
            <>
              <div className="zelify-lim-card" style={{ marginBottom: 12 }}>
                <h3>Cómo Zelify se alinea con LIM</h3>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, lineHeight: 1.55 }}>
                  Zelify puede posicionarse como{" "}
                  <strong>The Intelligence &amp; Orchestration Layer for Financial Institutions</strong>: infraestructura
                  financiera real, motor de eventos, capa de IA/analytics y APIs — el banco conserva el modelo de negocio
                  y las decisiones finales.
                </p>
                <LimArchitectureOverview />
              </div>
              <div className="zelify-lim-mapping">
                <table>
                  <thead>
                    <tr>
                      <th>Requerimiento LIM</th>
                      <th>Aporte Zelify</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Arquitectura cloud, APIs, multi-país</td>
                      <td>Core BaaS modular, integraciones bancarias existentes</td>
                    </tr>
                    <tr>
                      <td>Data pipelines e integración</td>
                      <td>Ingesta de eventos financieros; normalización multi-país</td>
                    </tr>
                    <tr>
                      <td>Analytics &amp; AI (marco)</td>
                      <td>Capa Cortex / Aetherion — señales, scoring, segmentación (sin decisión final)</td>
                    </tr>
                    <tr>
                      <td>Workflow orchestration</td>
                      <td>Eventos en tiempo real, triggers, routing hacia tesorería/comercial/CRM</td>
                    </tr>
                    <tr>
                      <td>Gobierno y cumplimiento</td>
                      <td>KYC/KYB, auditoría, controles multi-jurisdicción</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="zelify-lim-disclaimer" style={{ marginTop: 14 }}>
                Mensaje tipo pitch: una plataforma que combina infraestructura financiera + inteligencia + orquestación
                permite desplegar soluciones tipo LIM <strong>sin reconstruir el core</strong>.
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
