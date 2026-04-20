"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { GroupTable } from "../components/group-table";
import { GroupFilters } from "../components/group-filters";
import { groupsService } from "../services/groups.service";
import { Group, GroupView } from "../types/group.types";
import { useI18n } from "@/providers/i18n-provider";

export const GroupsListScreen: React.FC = () => {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as GroupView) || "all-groups";

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const allGroups = await groupsService.getGroups();
        
        // Filter based on view logic
        let filtered = allGroups;
        if (view === "active-loans") {
          filtered = allGroups.filter(g => g.hasActiveLoans);
        } else if (view === "active-deposits") {
          filtered = allGroups.filter(g => g.hasActiveDeposits);
        } else if (view === "sin-cuentas-activas") {
          filtered = allGroups.filter(g => !g.hasActiveLoans && !g.hasActiveDeposits);
        } else if (view === "sin-miembros") {
          filtered = allGroups.filter(g => g.membersCount === 0);
        }

        setGroups(filtered);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [view]);

  const viewTitle = getViewTitle(view, t);

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title" style={{ marginBottom: '32px' }}>
            {viewTitle}
          </h1>

          <div className="zelify-workspace-page__stack" style={{ gap: '24px' }}>
            <GroupFilters />

            {loading ? (
              <div className="zelify-workspace-page__loading">
                <div className="zelify-workspace-page__spinner" aria-hidden />
                <span>{t("groups.list.loading")}</span>
              </div>
            ) : (
              <GroupTable groups={groups} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getViewTitle(view: GroupView, t: (k: string) => string): string {
  switch (view) {
    case "active-loans":
      return t("groups.list.activeLoans");
    case "active-deposits":
      return t("groups.list.activeDeposits");
    case "sin-cuentas-activas":
      return t("groups.list.noActiveAccounts");
    case "sin-miembros":
      return t("groups.list.noMembers");
    default:
      return t("groups.list.allGroups");
  }
}
