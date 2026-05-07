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
  },
};

const PHASE_ORDER: PipelinePhase[] = [
  "ingest",
  "quality",
  "analytics",
  "insights",
  "workflow",
  "done",
];

function phaseLabel(p: PipelinePhase): string {
  const map: Record<PipelinePhase, string> = {
    idle: "Listo",
    ingest: "Ingesta de datos",
    quality: "Calidad y linaje",
    analytics: "Analytics & AI (marco)",
    insights: "Decisioning & insights",
    workflow: "Orquestación de workflows",
    done: "Flujo completado",
  };
  return map[p];
}

export function LimScreen() {
  const [tab, setTab] = useState<"resumen" | "simulador" | "zelify">("resumen");
  const [scenario, setScenario] = useState<ScenarioId>("withdrawal");
  const [phase, setPhase] = useState<PipelinePhase>("idle");
  const [logLines, setLogLines] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) clearInterval(timerRef.current);
    };
  }, []);

  const runSimulation = useCallback(() => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const cfg = SCENARIOS[scenario];
    setLogLines([]);
    setPhase("idle");

    let step = 0;
    const advance = () => {
      if (step >= PHASE_ORDER.length) {
        if (timerRef.current != null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        return;
      }

      const current = PHASE_ORDER[step];
      setPhase(current);

      if (current === "ingest") {
        setLogLines(cfg.ingestLines.map((l) => `[ingesta] ${l}`));
      }
      if (current === "quality") {
        setLogLines((prev) => [
          ...prev,
          "[calidad] DQ: completitud 99.2% · duplicados 0 · lineage hasta core contable",
        ]);
      }
      if (current === "analytics") {
        setLogLines((prev) => [...prev, `[analytics] ${cfg.analyticsHint}`]);
      }
      if (current === "insights") {
        setLogLines((prev) => [
          ...prev,
          `[insights] ${cfg.insightTitle}`,
          `[insights] ${cfg.insightBody}`,
        ]);
      }
      if (current === "workflow") {
        setLogLines((prev) => [
          ...prev,
          "[workflow] Evento LIM_TRIP · enrutamiento inteligente (sin ejecución financiera)",
          `[workflow] → ${cfg.workflowPrimary}`,
          `[workflow] → ${cfg.workflowSecondary}`,
        ]);
      }
      if (current === "done") {
        setLogLines((prev) => [...prev, "[done] LIM orquestó la decisión; el banco ejecuta fuera de esta capa."]);
        if (timerRef.current != null) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }

      step += 1;
    };

    advance();
    timerRef.current = setInterval(advance, 950);
  }, [scenario]);

  const cfg = SCENARIOS[scenario];

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
              <div className="zelify-lim-card" style={{ marginBottom: 12 }}>
                <h3>Simulación de flujo end-to-end</h3>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, lineHeight: 1.5 }}>
                  Elige un escenario y ejecuta el pipeline. Verás ingesta, calidad, analytics (marco), insights y
                  enrutamiento a workflows — sin transacciones financieras reales.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
                  <div style={{ minWidth: 280 }}>
                    <label className="text-sm font-semibold text-dark dark:text-white" htmlFor="lim-scenario">
                      Escenario
                    </label>
                    <AppSelect
                      id="lim-scenario"
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value as ScenarioId)}
                      disabled={phase !== "idle" && phase !== "done"}
                    >
                      <option value="withdrawal">{SCENARIOS.withdrawal.label}</option>
                      <option value="repricing">{SCENARIOS.repricing.label}</option>
                      <option value="liquidity">{SCENARIOS.liquidity.label}</option>
                    </AppSelect>
                  </div>
                  <AppButton tone="primary" onClick={() => runSimulation()} disabled={phase !== "idle" && phase !== "done"}>
                    Ejecutar flujo LIM
                  </AppButton>
                  <AppBadge tone={cfg.alertTone} size="sm">
                    Escenario activo
                  </AppBadge>
                </div>
                <div className="zelify-lim-pipeline" aria-live="polite">
                  <span>Fase:</span> <strong>{phaseLabel(phase)}</strong>
                  <span className="sep">|</span>
                  <span className="muted">Ingesta → DQ → Analytics → Insights → Workflow</span>
                </div>
              </div>

              <div className="zelify-lim-step">
                <h4>Registro del pipeline (sandbox)</h4>
                <div className="zelify-lim-log" role="log">
                  {logLines.length === 0 ? (
                    <span className="muted">Pulsa “Ejecutar flujo LIM” para ver un recorrido realista.</span>
                  ) : (
                    logLines.map((line, i) => (
                      <div key={`${i}-${line.slice(0, 24)}`}>
                        {line.startsWith("[done]") ? <span className="ok">{line}</span> : line}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {phase === "insights" || phase === "workflow" || phase === "done" ? (
                <div className="zelify-lim-card" style={{ marginTop: 12 }}>
                  <h3>Vista de insights (solo lectura)</h3>
                  <p style={{ fontWeight: 700, margin: "0 0 8px" }}>{cfg.insightTitle}</p>
                  <p style={{ margin: 0, color: "#475569", fontSize: 14, lineHeight: 1.55 }}>{cfg.insightBody}</p>
                </div>
              ) : null}

              <div className="zelify-lim-disclaimer">
                <strong>Importante:</strong> esta demo solo simula señales y orquestación. Los movimientos de fondos,
                tasas finales y ejecución comercial ocurren en sistemas del banco fuera de LIM.
              </div>
            </>
          ) : null}

          {tab === "zelify" ? (
            <>
              <div className="zelify-lim-card" style={{ marginBottom: 12 }}>
                <h3>Cómo Zelify se alinea con LIM</h3>
                <p style={{ margin: "0 0 10px", color: "#64748b", fontSize: 14, lineHeight: 1.55 }}>
                  Zelify puede posicionarse como <strong>The Intelligence &amp; Orchestration Layer for Financial Institutions</strong>
                  : infraestructura financiera real, motor de eventos, capa de IA/analytics y APIs — el banco conserva el
                  modelo de negocio y las decisiones finales.
                </p>
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
