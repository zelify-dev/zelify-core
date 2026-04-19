"use client";
import "./_home-screen.css"

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

const indicators = [
  {
    label: "Active clients",
    value: "48,392",
    meta: "1,204 added this month",
  },
  {
    label: "Organizations",
    value: "128",
    meta: "6 pending approval",
  },
  {
    label: "Open accounts",
    value: "132,640",
    meta: "942 opened today",
  },
  {
    label: "Transactions today",
    value: "284,901",
    meta: "$18.4M settled",
  },
  {
    label: "Loans awaiting approval",
    value: "37",
    meta: "9 submitted in the last hour",
  },
  {
    label: "PAR > 30 days",
    value: "2.8%",
    meta: "Within policy threshold",
  },
];

const recentActivity: ActivityFeedItem[] = [
  {
    type: "Client onboarding",
    title: "New corporate client approved for Andean Treasury",
    meta: "Organization: Andean Treasury Group",
    time: "8 min ago",
    marker: "CL",
  },
  {
    type: "Transaction review",
    title: "Large transfer flagged for secondary review",
    meta: "Account: 002-4481 / Amount: $86,420",
    time: "14 min ago",
    marker: "TX",
  },
  {
    type: "Account event",
    title: "Operational savings account opened",
    meta: "Organization: Nova Capital / Product: Business Saver",
    time: "31 min ago",
    marker: "AC",
  },
  {
    type: "Compliance",
    title: "KYC documentation completed for a new entity",
    meta: "Client: Pacific Bridge Holdings",
    time: "52 min ago",
    marker: "KY",
  },
  {
    type: "Payments",
    title: "Batch payment file released to processing",
    meta: "Batch: PAY-2026-04-18-09",
    time: "1 hr ago",
    marker: "PM",
  },
];

const pendingActions: TaskQueueSummaryItem[] = [
  { label: "Overdue", value: "12" },
  { label: "Due today", value: "29" },
  { label: "Upcoming", value: "41" },
];

const taskQueueItems: TaskQueueItem[] = [
  {
    title: "Control total client balance",
    owner: "Juan Carlos",
    dueDate: "18-04-2026",
  },
  {
    title: "Review status of loans",
    owner: "Operations team",
    dueDate: "18-04-2026",
  },
  {
    title: "Check overall liquidity position",
    owner: "Treasury desk",
    dueDate: "19-04-2026",
  },
  {
    title: "Release outbound communications batch",
    owner: "Client operations",
    dueDate: "20-04-2026",
  },
];

const quickViews: QuickViewItem[] = [
  { count: "21", label: "Active clients", meta: "Saved operational view" },
  { count: "18", label: "Active loans", meta: "Approval pipeline" },
  { count: "9", label: "Dormant accounts", meta: "Reactivation review" },
  { count: "9", label: "Compliance cases", meta: "In progress" },
  { count: "32", label: "Deposit active", meta: "Portfolio segment" },
];

const systemSummary: SummaryGridItem[] = [
  {
    title: "Settlement health",
    description: "Core settlement flows are operating within expected thresholds.",
  },
  {
    title: "Review workload",
    description: "Manual review queue increased 8% compared to yesterday morning.",
  },
  {
    title: "Platform availability",
    description: "All operational services are available. No degraded banking modules detected.",
  },
];

export default function HomeScreen() {
  return (
    <div className="zelify-home">
      <ZelifyTopNavbar activeItem="Dashboard" />

      <main className="zelify-home__content">
        <section className="zelify-home__hero">
          <div>
            <p className="zelify-home__eyebrow">OPERATIONS WORKSPACE</p>
            <h1 className="zelify-home__title">Daily operations</h1>
            <p className="zelify-home__subtitle">
              Operational landing page for client activity, transaction throughput,
              approval queues and saved working views.
            </p>
          </div>
        </section>

        <section className="zelify-home__hero-meta" aria-label="Operating context">
          <div className="zelify-home__hero-meta-block">
            <span className="zelify-home__hero-meta-label">Operating window</span>
            <strong>Tuesday, 18 April</strong>
            <span>09:30 UTC-5</span>
          </div>
          <div className="zelify-home__hero-meta-block">
            <span className="zelify-home__hero-meta-label">Workspace scope</span>
            <strong>All branches</strong>
            <span>Retail and corporate operations</span>
          </div>
        </section>

        <section className="zelify-home__kpis" aria-label="Key indicators">
          <PanelHeader eyebrow="Indicators" title="Operational indicators" />
          <div className="zelify-home__indicator-grid">
            {indicators.map((item) => (
              <IndicatorTile
                key={item.label}
                label={item.label}
                value={item.value}
                meta={item.meta}
              />
            ))}
          </div>
        </section>

        <section className="zelify-home__main-grid">
          <article className="zelify-panel zelify-panel--activity">
            <PanelHeader eyebrow="Latest activity" title="Recent activity" />
            <ActivityFeed items={recentActivity} />
          </article>

          <div className="zelify-home__side-column">
            <article className="zelify-panel">
              <PanelHeader eyebrow="Your tasks" title="Task queue" />
              <TaskQueue summary={pendingActions} tasks={taskQueueItems} />
            </article>

            <article className="zelify-panel">
              <PanelHeader eyebrow="Your favourite views" title="Saved views" />
              <QuickViewList items={quickViews} />
            </article>
          </div>
        </section>

        <section className="zelify-panel zelify-panel--summary">
          <PanelHeader
            eyebrow="Operational summary"
            title="System summary"
            aside={<AppBadge className="zelify-panel__badge">3 monitored areas</AppBadge>}
          />
          <SummaryGrid items={systemSummary} />
        </section>
      </main>
    </div>
  );
}
