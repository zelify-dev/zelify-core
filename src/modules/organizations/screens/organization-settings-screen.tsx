"use client";

import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { UnitTable } from "../components/unit-table";
import { organizationsService } from "../services/organizations.service";
import { OrganizationUnit, UnitType } from "../types/organization.types";
import { AppButton } from "@/components/ui/atoms/button/app-button";
import { AppCheckbox } from "@/components/ui/atoms/checkbox/app-checkbox";

export const OrganizationSettingsScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UnitType>("branch");
  const [data, setData] = useState<OrganizationUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeactivated, setShowDeactivated] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result =
          activeTab === "branch"
            ? await organizationsService.getBranches()
            : await organizationsService.getCentres();

        setData(showDeactivated ? result : result.filter((u) => u.state !== "DEACTIVATED"));
      } catch (error) {
        console.error("Error fetching organization data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, showDeactivated]);

  const unitLabel = activeTab === "branch" ? "Branch" : "Centre";
  const deactivatedLabel = activeTab === "branch" ? "branches" : "centres";

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <div className="zelify-org-tabs">
            <div className="zelify-org-tabs__list" role="tablist" aria-label="Organization units">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "branch"}
                className={["zelify-org-tab", activeTab === "branch" ? "is-active" : ""].filter(Boolean).join(" ")}
                onClick={() => setActiveTab("branch")}
              >
                Branches
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "centre"}
                className={["zelify-org-tab", activeTab === "centre" ? "is-active" : ""].filter(Boolean).join(" ")}
                onClick={() => setActiveTab("centre")}
              >
                Centres
              </button>
            </div>

            <AppButton
              tone="primary"
              type="button"
              onClick={() => console.log(`New ${activeTab}`)}
            >
              <Plus size={16} strokeWidth={2} aria-hidden />
              New {unitLabel}
            </AppButton>
          </div>

          <div className="zelify-org-toolbar">
            <AppCheckbox
              id="org-show-deactivated"
              checked={showDeactivated}
              onChange={(e) => setShowDeactivated(e.target.checked)}
              label={`Show deactivated ${deactivatedLabel}`}
            />
          </div>

          {loading ? (
            <div className="zelify-workspace-page__loading">
              <div className="zelify-workspace-page__spinner" aria-hidden />
              <span>Loading…</span>
            </div>
          ) : (
            <div className="zelify-workspace-page__stack">
              <UnitTable units={data} type={unitLabel} />
              <SandboxBanner />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
