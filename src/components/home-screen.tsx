"use client";
import "./_home-screen.css";
import { useEffect, useMemo, useState } from "react";

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
import { useRouter } from "next/navigation";

function localizeText(text: string, locale: "en" | "es"): string {
  const [en, es] = text.split(" / ");
  if (!es) return text;
  return locale === "es" ? es : en;
}

export default function HomeScreen() {
  const { locale } = useI18n();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Array<{ id: string; state: string }>>([]);
  const [loans, setLoans] = useState<Array<{ id: string; lifecycleState: string }>>([]);
  const [deposits, setDeposits] = useState<Array<{ id: string; state: string }>>([]);
  const [branches, setBranches] = useState<Array<{ id: string }>>([]);
  const [activities, setActivities] = useState<Array<{ id: string; action: string; module: string; actor: string; created_at: string; affected_item_name?: string | null; affected_item_id?: string | null }>>([]);

  useEffect(() => {
    const load = async () => {
      const [c, l, d, b, a] = await Promise.all([
        fetch("/api/customers", { cache: "no-store" }),
        fetch("/api/loans", { cache: "no-store" }),
        fetch("/api/deposits", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
        fetch("/api/activities?page=1&pageSize=50&module=all&branch=all", { cache: "no-store" }),
      ]);
      if (c.ok) setCustomers(((await c.json()) as { data: Array<{ id: string; state: string }> }).data ?? []);
      if (l.ok) setLoans(((await l.json()) as { data: Array<{ id: string; lifecycleState: string }> }).data ?? []);
      if (d.ok) setDeposits(((await d.json()) as { data: Array<{ id: string; state: string }> }).data ?? []);
      if (b.ok) setBranches(((await b.json()) as { branches: Array<{ id: string }> }).branches ?? []);
      if (a.ok) setActivities(((await a.json()) as { data: Array<{ id: string; action: string; module: string; actor: string; created_at: string; affected_item_name?: string | null; affected_item_id?: string | null }> }).data ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const indicators = useMemo(() => {
    const activeClients = customers.filter((c) => c.state === "ACTIVE").length;
    const activeLoans = loans.filter((l) => l.lifecycleState === "ACTIVE").length;
    const pendingLoans = loans.filter((l) => l.lifecycleState === "PENDING_APPROVAL").length;
    const par30 = loans.length === 0 ? 0 : (loans.filter((l) => l.lifecycleState === "ACTIVE_IN_ARREARS").length / loans.length) * 100;
    const activeDeposits = deposits.filter((d) => d.state === "ACTIVE").length;
    return [
      { label: "Active clients / Clientes activos", value: String(activeClients), meta: "Real-time from customers / Tiempo real desde clientes", href: "/customers" },
      { label: "Branches / Sedes", value: String(branches.length), meta: "Current configured branches / Sedes configuradas", href: "/branches" },
      { label: "Open accounts / Cuentas abiertas", value: String(deposits.length), meta: `${activeDeposits} active / ${activeDeposits} activas`, href: "/deposits" },
      { label: "Transactions today / Eventos hoy", value: String(activities.length), meta: "Based on system activities / Basado en actividades del sistema", href: "/activities" },
      { label: "Loans awaiting approval / Préstamos pendientes de aprobación", value: String(pendingLoans), meta: "Pending approval queue / Cola pendiente", href: "/loans" },
      { label: "PAR > 30 days / PAR > 30 días", value: `${par30.toFixed(1)}%`, meta: "From loan lifecycle states / Desde estados de préstamo", href: "/reports" },
    ];
  }, [customers, loans, deposits, branches, activities]);

  const recentActivity: ActivityFeedItem[] = useMemo(
    () =>
      activities.slice(0, 10).map((a) => ({
        id: a.id,
        type: `${a.module} / ${a.module}`,
        title: `${a.action} / ${a.action}`,
        meta: `${a.affected_item_name ?? "Elemento"} ${a.affected_item_id ?? ""} / ${a.actor}`,
        time: `${new Date(a.created_at).toLocaleString()} / ${new Date(a.created_at).toLocaleString()}`,
        marker: (a.module || "EV").slice(0, 2).toUpperCase(),
      })),
    [activities]
  );

  const pendingActions: TaskQueueSummaryItem[] = useMemo(() => {
    const overdue = loans.filter((l) => l.lifecycleState === "ACTIVE_IN_ARREARS").length;
    const dueToday = activities.length;
    const upcoming = loans.filter((l) => l.lifecycleState === "APPROVED").length + deposits.filter((d) => d.state === "PENDING_APPROVAL").length;
    return [
      { label: "Overdue / Vencidas", value: String(overdue) },
      { label: "Due today / Para hoy", value: String(dueToday) },
      { label: "Upcoming / Próximas", value: String(upcoming) },
    ];
  }, [loans, deposits, activities]);

  const taskQueueItems: TaskQueueItem[] = useMemo(() => [
    { title: "Revisar préstamos en mora / Revisar préstamos en mora", owner: "Riesgo", dueDate: new Date().toISOString().slice(0, 10) },
    { title: "Aprobar solicitudes pendientes / Aprobar solicitudes pendientes", owner: "Crédito", dueDate: new Date().toISOString().slice(0, 10) },
    { title: "Monitorear cuentas dormant / Monitorear cuentas dormant", owner: "Operaciones", dueDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10) },
    { title: "Validar eventos críticos / Validar eventos críticos", owner: "Cumplimiento", dueDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10) },
  ], []);

  const quickViews: QuickViewItem[] = useMemo(() => [
    { count: String(customers.filter((c) => c.state === "ACTIVE").length), label: "Active clients / Clientes activos", meta: "Real view / Vista real" },
    { count: String(loans.filter((l) => l.lifecycleState === "ACTIVE").length), label: "Active loans / Préstamos activos", meta: "Lifecycle state / Estado de ciclo" },
    { count: String(deposits.filter((d) => d.state === "DORMANT").length), label: "Dormant accounts / Cuentas inactivas", meta: "Dormant monitoring / Monitoreo dormant" },
    { count: String(activities.filter((a) => a.module === "customers" || a.module === "companies").length), label: "Compliance cases / Casos de cumplimiento", meta: "From activities / Desde actividades" },
    { count: String(deposits.filter((d) => d.state === "ACTIVE").length), label: "Deposit active / Depósitos activos", meta: "Portfolio segment / Segmento de cartera" },
  ], [customers, loans, deposits, activities]);

  const systemSummary: SummaryGridItem[] = useMemo(() => [
    {
      title: "Settlement health / Salud de liquidación",
      description: `Deposits active: ${deposits.filter((d) => d.state === "ACTIVE").length}. / Depósitos activos: ${deposits.filter((d) => d.state === "ACTIVE").length}.`,
    },
    {
      title: "Review workload / Carga de revisión",
      description: `Pending approvals: ${loans.filter((l) => l.lifecycleState === "PENDING_APPROVAL").length + deposits.filter((d) => d.state === "PENDING_APPROVAL").length}. / Pendientes de aprobación: ${loans.filter((l) => l.lifecycleState === "PENDING_APPROVAL").length + deposits.filter((d) => d.state === "PENDING_APPROVAL").length}.`,
    },
    {
      title: "Platform availability / Disponibilidad de plataforma",
      description: `Recent system events: ${activities.length}. / Eventos recientes del sistema: ${activities.length}.`,
    },
  ], [deposits, loans, activities]);

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
            {loading ? <p className="zelify-home__subtitle">{localizeText("Loading real-time data... / Cargando datos en tiempo real...", locale)}</p> : null}
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
                actionLabel={localizeText("Open view / Abrir vista", locale)}
                onAction={() => router.push(item.href)}
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
