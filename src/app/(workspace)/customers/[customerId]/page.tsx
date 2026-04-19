"use client";

import { use, useState } from "react";
import { notFound } from "next/navigation";
import { mockCustomers } from "@/mocks/customers";
import { CustomerProfileHeader } from "@/components/ui/organisms/customers/customer-profile-header";
import { CustomerOverview } from "@/components/ui/organisms/customers/customer-overview";
import { CustomerActivityFeed } from "@/components/ui/organisms/customers/customer-activity-feed";
import { WorkspaceShell } from "@/components/ui/templates/workspace-shell/workspace-shell";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

type TabId = "overview" | "products" | "attachments" | "tasks" | "communications" | "comments";

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const customer = mockCustomers.find((c) => c.id === customerId);

  if (!customer) {
    notFound();
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "products", label: `Products (${customer.accounts.length})` },
    { id: "attachments", label: "Attachments" },
    { id: "tasks", label: "Tasks" },
    { id: "communications", label: "Communications" },
    { id: "comments", label: "Comments" },
  ];

  return (
    <WorkspaceShell>
    <main className="zelify-home">
      <div className="zelify-home__content">
        <CustomerProfileHeader customer={customer} />

        <nav className="zelify-profile-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`zelify-profile-tab ${activeTab === tab.id ? "is-active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="zelify-customer-detail-grid">
          <div className="zelify-customer-detail-main">
            {activeTab === "overview" && <CustomerOverview customer={customer} />}
            {activeTab !== "overview" && (
              <section className="zelify-panel" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                Feature coming soon: {tabs.find(t => t.id === activeTab)?.label}
              </section>
            )}
          </div>
          
          <CustomerActivityFeed events={customer.activity} />
        </div>
      </div>
    </main>
    </WorkspaceShell>
  );
}
