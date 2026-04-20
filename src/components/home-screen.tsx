"use client";
import "./_home-screen.css";

import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { PanelHeader } from "@/components/ui/molecules/panel-header/panel-header";
import {
  ActivityFeed,
  type ActivityFeedItem,
} from "@/components/ui/organisms/activity-feed/activity-feed";
import { QuickViewList, type QuickViewItem } from "@/components/ui/organisms/quick-view-list/quick-view-list";
import {
  SummaryGrid,
  type SummaryGridItem,
} from "@/components/ui/organisms/summary-grid/summary-grid";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { IndicatorTile } from "@/components/ui/molecules/indicator-tile/indicator-tile";
import {
  TaskQueue,
  type TaskQueueItem,
  type TaskQueueSummaryItem,
} from "@/components/ui/organisms/task-queue/task-queue";

import "./home-screen.css";
import { useI18n } from "@/providers/i18n-provider";

function localizeText(text: string, locale: "en" | "es"): string {
  const [en, es] = text.split(" / ");
  if (!es) return text;
  return locale === "es" ? es : en;
}

const indicators = [
  {
    label: "Active clients / Clientes activos",
    value: "48,392",
    meta: "1,204 added this month / 1,204 agregados este mes",
  },
  {
    label: "Organizations / Organizaciones",
    value: "128",
    meta: "6 pending approval / 6 pendientes de aprobación",
  },
  {
    label: "Open accounts / Cuentas abiertas",
    value: "132,640",
    meta: "942 opened today / 942 abiertas hoy",
  },
  {
    label: "Transactions today / Transacciones hoy",
    value: "284,901",
    meta: "$18.4M settled / $18.4M liquidados",
  },
  {
    label: "Loans awaiting approval / Préstamos pendientes de aprobación",
    value: "37",
    meta: "9 submitted in the last hour / 9 enviados en la última hora",
  },
  {
    label: "PAR > 30 days / PAR > 30 días",
    value: "2.8%",
    meta: "Within policy threshold / Dentro del umbral de política",
  },
];

const recentActivity: ActivityFeedItem[] = [
  {
    type: "Client onboarding / Incorporación de cliente",
    title: "New corporate client approved for Andean Treasury / Nuevo cliente corporativo aprobado para Andean Treasury",
    meta: "Organization: Andean Treasury Group / Organización: Andean Treasury Group",
    time: "8 min ago / hace 8 min",
    marker: "CL",
  },
  {
    type: "Transaction review / Revisión de transacción",
    title: "Large transfer flagged for secondary review / Transferencia grande marcada para revisión secundaria",
    meta: "Account: 002-4481 / Amount: $86,420 / Cuenta: 002-4481 / Monto: $86,420",
    time: "14 min ago / hace 14 min",
    marker: "TX",
  },
  {
    type: "Account event / Evento de cuenta",
    title: "Operational savings account opened / Cuenta de ahorro operativa abierta",
    meta: "Organization: Nova Capital / Product: Business Saver / Organización: Nova Capital / Producto: Business Saver",
    time: "31 min ago / hace 31 min",
    marker: "AC",
  },
  {
    type: "Compliance / Cumplimiento",
    title: "KYC documentation completed for a new entity / Documentación KYC completada para una nueva entidad",
    meta: "Client: Pacific Bridge Holdings / Cliente: Pacific Bridge Holdings",
    time: "52 min ago / hace 52 min",
    marker: "KY",
  },
  {
    type: "Payments / Pagos",
    title: "Batch payment file released to processing / Archivo masivo de pagos liberado a procesamiento",
    meta: "Batch: PAY-2026-04-18-09 / Lote: PAY-2026-04-18-09",
    time: "1 hr ago / hace 1 h",
    marker: "PM",
  },
];

const pendingActions: TaskQueueSummaryItem[] = [
  { label: "Overdue / Vencidas", value: "12" },
  { label: "Due today / Para hoy", value: "29" },
  { label: "Upcoming / Próximas", value: "41" },
];

const taskQueueItems: TaskQueueItem[] = [
  {
    title: "Control total client balance / Controlar saldo total de clientes",
    owner: "Juan Carlos",
    dueDate: "18-04-2026",
  },
  {
    title: "Review status of loans / Revisar estado de préstamos",
    owner: "Operations team / Equipo de operaciones",
    dueDate: "18-04-2026",
  },
  {
    title: "Check overall liquidity position / Verificar posición general de liquidez",
    owner: "Treasury desk / Mesa de tesorería",
    dueDate: "19-04-2026",
  },
  {
    title: "Release outbound communications batch / Liberar lote de comunicaciones salientes",
    owner: "Client operations / Operaciones de clientes",
    dueDate: "20-04-2026",
  },
];

const quickViews: QuickViewItem[] = [
  { count: "21", label: "Active clients / Clientes activos", meta: "Saved operational view / Vista operativa guardada" },
  { count: "18", label: "Active loans / Préstamos activos", meta: "Approval pipeline / Flujo de aprobaciones" },
  { count: "9", label: "Dormant accounts / Cuentas inactivas", meta: "Reactivation review / Revisión de reactivación" },
  { count: "9", label: "Compliance cases / Casos de cumplimiento", meta: "In progress / En progreso" },
  { count: "32", label: "Deposit active / Depósitos activos", meta: "Portfolio segment / Segmento de cartera" },
];

const systemSummary: SummaryGridItem[] = [
  {
    title: "Settlement health / Salud de liquidación",
    description: "Core settlement flows are operating within expected thresholds. / Los flujos centrales de liquidación operan dentro de los umbrales esperados.",
  },
  {
    title: "Review workload / Carga de revisión",
    description: "Manual review queue increased 8% compared to yesterday morning. / La cola de revisión manual aumentó 8% frente a ayer por la mañana.",
  },
  {
    title: "Platform availability / Disponibilidad de plataforma",
    description: "All operational services are available. No degraded banking modules detected. / Todos los servicios operativos están disponibles. No se detectan módulos degradados.",
  },
];

export default function HomeScreen() {
  const { locale } = useI18n();

  return (
    <div className="zelify-home">
      <ZelifyTopNavbar activeNavId="dashboard" />

      <main className="zelify-home__content">
        <section className="zelify-home__hero">
          <div>
            <p className="zelify-home__eyebrow">
              {localizeText("OPERATIONS WORKSPACE / ESPACIO DE OPERACIONES", locale)}
            </p>
            <h1 className="zelify-home__title">{localizeText("Daily operations / Operaciones diarias", locale)}</h1>
            <p className="zelify-home__subtitle">
              {localizeText(
                "Operational landing page for client activity, transaction throughput, approval queues and saved working views. / Página operativa para actividad de clientes, volumen transaccional, colas de aprobación y vistas de trabajo guardadas.",
                locale
              )}
            </p>
          </div>
        </section>

        <section
          className="zelify-home__hero-meta"
          aria-label={localizeText("Operating context / Contexto operativo", locale)}
        >
          <div className="zelify-home__hero-meta-block">
            <span className="zelify-home__hero-meta-label">
              {localizeText("Operating window / Ventana operativa", locale)}
            </span>
            <strong>{localizeText("Tuesday, 18 April / Martes, 18 de abril", locale)}</strong>
            <span>09:30 UTC-5</span>
          </div>
          <div className="zelify-home__hero-meta-block">
            <span className="zelify-home__hero-meta-label">
              {localizeText("Workspace scope / Alcance del espacio", locale)}
            </span>
            <strong>{localizeText("All branches / Todas las sucursales", locale)}</strong>
            <span>{localizeText("Retail and corporate operations / Operaciones minoristas y corporativas", locale)}</span>
          </div>
        </section>

        <section className="zelify-home__kpis" aria-label={localizeText("Key indicators / Indicadores clave", locale)}>
          <PanelHeader
            eyebrow={localizeText("Indicators / Indicadores", locale)}
            title={localizeText("Operational indicators / Indicadores operativos", locale)}
          />
          <div className="zelify-home__indicator-grid">
            {indicators.map((item) => (
              <IndicatorTile
                key={item.label}
                label={localizeText(item.label, locale)}
                value={item.value}
                meta={localizeText(item.meta, locale)}
              />
            ))}
          </div>
        </section>

        <section className="zelify-home__main-grid">
          <article className="zelify-panel zelify-panel--activity">
            <PanelHeader
              eyebrow={localizeText("Latest activity / Actividad reciente", locale)}
              title={localizeText("Recent activity / Actividad reciente", locale)}
            />
            <ActivityFeed
              items={recentActivity.map((item) => ({
                ...item,
                type: localizeText(item.type, locale),
                title: localizeText(item.title, locale),
                meta: localizeText(item.meta, locale),
                time: localizeText(item.time, locale),
              }))}
            />
          </article>

          <div className="zelify-home__side-column">
            <article className="zelify-panel">
              <PanelHeader
                eyebrow={localizeText("Your tasks / Tus tareas", locale)}
                title={localizeText("Task queue / Cola de tareas", locale)}
              />
              <TaskQueue
                summary={pendingActions.map((item) => ({
                  ...item,
                  label: localizeText(item.label, locale),
                }))}
                tasks={taskQueueItems.map((item) => ({
                  ...item,
                  title: localizeText(item.title, locale),
                  owner: localizeText(item.owner, locale),
                }))}
              />
            </article>

            <article className="zelify-panel">
              <PanelHeader
                eyebrow={localizeText("Your favourite views / Tus vistas favoritas", locale)}
                title={localizeText("Saved views / Vistas guardadas", locale)}
              />
              <QuickViewList
                items={quickViews.map((item) => ({
                  ...item,
                  label: localizeText(item.label, locale),
                  meta: localizeText(item.meta, locale),
                }))}
              />
            </article>
          </div>
        </section>

        <section className="zelify-panel zelify-panel--summary">
          <PanelHeader
            eyebrow={localizeText("Operational summary / Resumen operativo", locale)}
            title={localizeText("System summary / Resumen del sistema", locale)}
            aside={
              <AppBadge className="zelify-panel__badge">
                {localizeText("3 monitored areas / 3 áreas monitoreadas", locale)}
              </AppBadge>
            }
          />
          <SummaryGrid
            items={systemSummary.map((item) => ({
              title: localizeText(item.title, locale),
              description: localizeText(item.description, locale),
            }))}
          />
        </section>
      </main>
    </div>
  );
}
