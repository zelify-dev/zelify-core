"use client";

import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppIconButton } from "@/components/ui/atoms/icon-button/app-icon-button";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { AppText } from "@/components/ui/atoms/text/app-text";
import { ContextSelector } from "@/components/ui/molecules/context-selector/context-selector";
import { DropdownMenu } from "@/components/ui/molecules/dropdown-menu/dropdown-menu";
import { IndicatorTile } from "@/components/ui/molecules/indicator-tile/indicator-tile";
import { NavTab } from "@/components/ui/molecules/nav-tab/nav-tab";
import { PanelHeader } from "@/components/ui/molecules/panel-header/panel-header";
import { ProfileTrigger } from "@/components/ui/molecules/profile-trigger/profile-trigger";
import { TopbarSearchBox } from "@/components/ui/molecules/search-box/topbar-search-box";
import { StatCard } from "@/components/ui/molecules/stat-card/stat-card";
import { ActivityFeed } from "@/components/ui/organisms/activity-feed/activity-feed";
import { QuickViewList } from "@/components/ui/organisms/quick-view-list/quick-view-list";
import { StatusList } from "@/components/ui/organisms/status-list/status-list";
import { SummaryGrid } from "@/components/ui/organisms/summary-grid/summary-grid";
import { TaskQueue } from "@/components/ui/organisms/task-queue/task-queue";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";

import "./home-screen.css";
import "./atomic-design-screen.css";

const activityItems = [
  {
    type: "Client onboarding",
    title: "Corporate client approved for treasury operations",
    meta: "Organization: Andean Treasury Group",
    time: "8 min ago",
    marker: "CL",
  },
  {
    type: "Transaction review",
    title: "Large transfer routed to secondary review",
    meta: "Account: 002-4481 / Amount: $86,420",
    time: "14 min ago",
    marker: "TX",
  },
];

const statusItems = [
  { label: "Overdue", value: "12" },
  { label: "Due today", value: "29" },
  { label: "Upcoming", value: "41" },
];

const quickViewItems = [
  { count: "21", label: "High-value transactions", meta: "Saved view" },
  { count: "9", label: "Organizations pending approval", meta: "Approval queue" },
  { count: "7", label: "Daily reconciliation queue", meta: "Operations" },
];

const summaryItems = [
  {
    title: "Settlement health",
    description: "Core settlement flows remain within expected thresholds.",
  },
  {
    title: "Review workload",
    description: "Manual review volume increased compared to the morning baseline.",
  },
  {
    title: "Platform availability",
    description: "Operational services remain available with no degraded modules.",
  },
];

export default function AtomicDesignScreen() {
  return (
    <div className="atomic-design-page">
      <ZelifyTopNavbar activeItem="Dashboard" />

      <main className="atomic-design-page__content">
        <section className="atomic-design-page__hero">
          <div>
            <span className="atomic-design-page__eyebrow">Component Library</span>
            <h1 className="atomic-design-page__title">Atomic design catalog</h1>
            <AppText className="atomic-design-page__lead" tone="muted">
              Internal reference for the components already built in Zelify. This
              page lets the team review the current atoms, molecules and organisms
              from one route.
            </AppText>
          </div>

          <div className="atomic-design-page__status">
            <div className="atomic-design-page__status-card">
              <span className="atomic-design-page__status-label">Atomic design</span>
              <strong>Active</strong>
              <AppText tone="muted">
                Reusable UI pieces grouped by atom, molecule and organism.
              </AppText>
            </div>
            <div className="atomic-design-page__status-card">
              <span className="atomic-design-page__status-label">Tamagui</span>
              <strong>Foundation active</strong>
              <AppText tone="muted">
                Provider and generated CSS are active globally. Current showcase
                components use that foundation, but not every visual primitive is
                yet implemented as a pure Tamagui component.
              </AppText>
            </div>
          </div>
        </section>

        <CatalogSection
          title="Atoms"
          description="Smallest reusable primitives currently available."
        >
          <PreviewCard label="AppButton">
            <AppButton className="atomic-design-demo__button">Neutral action</AppButton>
          </PreviewCard>
          <PreviewCard label="AppInput">
            <div className="atomic-design-demo__input-shell">
              <AppInput
                className="atomic-design-demo__input"
                placeholder="Search account or client"
              />
            </div>
          </PreviewCard>
          <PreviewCard label="AppIconButton">
            <AppIconButton ariaLabel="Notifications">
              <BellIcon />
            </AppIconButton>
          </PreviewCard>
          <PreviewCard label="AppAvatar">
            <AppAvatar initials="JC" />
          </PreviewCard>
          <PreviewCard label="AppBadge">
            <AppBadge className="atomic-design-demo__badge">3 monitored areas</AppBadge>
          </PreviewCard>
          <PreviewCard label="AppText">
            <div className="atomic-design-demo__text-group">
              <AppText tone="strong">Primary text</AppText>
              <AppText tone="muted">Muted operational copy</AppText>
            </div>
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Molecules"
          description="Compositions of small primitives used repeatedly across product surfaces."
        >
          <PreviewCard label="ContextSelector">
            <ContextSelector label="ALL ORGANIZATIONS" icon={<ChevronDownIcon />} />
          </PreviewCard>
          <PreviewCard label="NavTab">
            <div className="atomic-design-demo__nav-tabs">
              <NavTab label="Dashboard" isActive />
              <NavTab label="Products" trailingIcon={<ChevronDownIcon />} />
            </div>
          </PreviewCard>
          <PreviewCard label="DropdownMenu">
            <div className="atomic-design-demo__menu-shell">
              <DropdownMenu
                className="atomic-design-demo__dropdown"
                items={["Client", "Organization", "Account", "User"]}
              />
            </div>
          </PreviewCard>
          <PreviewCard label="PanelHeader">
            <PanelHeader
              eyebrow="Operational summary"
              title="System summary"
              aside={<AppBadge className="atomic-design-demo__badge">3 monitored areas</AppBadge>}
            />
          </PreviewCard>
          <PreviewCard label="ProfileTrigger">
            <ProfileTrigger
              name="Juan Carlos"
              initials="JC"
              trailingIcon={<ChevronDownIcon />}
            />
          </PreviewCard>
          <PreviewCard label="TopbarSearchBox">
            <TopbarSearchBox
              results={[
                { group: "Clients", label: "Andean Treasury Group" },
                { group: "Accounts", label: "002-4481 Operating Account" },
                { group: "Transactions", label: "TX-2026-04-18-88214" },
              ]}
            />
          </PreviewCard>
          <PreviewCard label="StatCard">
            <StatCard label="Transactions Today" value="284,901" delta="$18.4M settled" />
          </PreviewCard>
          <PreviewCard label="IndicatorTile">
            <IndicatorTile
              label="Loans awaiting approval"
              value="37"
              meta="9 submitted in the last hour"
            />
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Organisms"
          description="Larger operational blocks already available for dashboard assembly."
        >
          <PreviewCard label="ActivityFeed" wide>
            <ActivityFeed items={activityItems} />
          </PreviewCard>
          <PreviewCard label="StatusList">
            <StatusList items={statusItems} />
          </PreviewCard>
          <PreviewCard label="QuickViewList">
            <QuickViewList items={quickViewItems} />
          </PreviewCard>
          <PreviewCard label="TaskQueue" wide>
            <TaskQueue
              summary={statusItems}
              tasks={[
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
              ]}
            />
          </PreviewCard>
          <PreviewCard label="SummaryGrid" wide>
            <SummaryGrid items={summaryItems} />
          </PreviewCard>
          <PreviewCard label="ZelifyTopNavbar" full>
            <div className="atomic-design-demo__navbar-shell">
              <ZelifyTopNavbar activeItem="Dashboard" />
            </div>
          </PreviewCard>
        </CatalogSection>

        <CatalogSection
          title="Templates"
          description="No template components have been implemented yet. Only the folder structure exists for future shells."
        >
          <PreviewCard label="Template status">
            <AppText tone="muted">
              `auth-shell`, `dashboard-shell` and `detail-shell` are still pending implementation.
            </AppText>
          </PreviewCard>
        </CatalogSection>
      </main>
    </div>
  );
}

type CatalogSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function CatalogSection({ title, description, children }: CatalogSectionProps) {
  return (
    <section className="atomic-design-section">
      <div className="atomic-design-section__header">
        <h2 className="atomic-design-section__title">{title}</h2>
        <AppText tone="muted" className="atomic-design-section__description">
          {description}
        </AppText>
      </div>
      <div className="atomic-design-section__grid">{children}</div>
    </section>
  );
}

type PreviewCardProps = {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  full?: boolean;
};

function PreviewCard({ label, children, wide = false, full = false }: PreviewCardProps) {
  const classes = [
    "atomic-design-card",
    wide ? "is-wide" : "",
    full ? "is-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={classes}>
      <span className="atomic-design-card__label">{label}</span>
      <div className="atomic-design-card__body">{children}</div>
    </article>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 16.25a1.87 1.87 0 0 0 1.83-1.5H7.17A1.87 1.87 0 0 0 9 16.25ZM14.25 13.25H3.75v-.75l1.5-1.5V7.75a3.75 3.75 0 1 1 7.5 0V11l1.5 1.5v.75Z"
        fill="#F8FAFC"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M3.5 5.25 7 8.75l3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
