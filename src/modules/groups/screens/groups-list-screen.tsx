"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { AppInput } from "@/components/ui/atoms/input/app-input";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { useI18n } from "@/providers/i18n-provider";
import { groupsService } from "../services/groups.service";
import { Group, GroupView } from "../types/group.types";
import { GroupTable } from "../components/group-table";
import { useEffect } from "react";

import "@/components/ui/templates/workspace-page.css";
import "./groups-list-screen.css";

export function GroupsListScreen() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as GroupView | null) ?? "all-groups";

  const [query, setQuery] = useState("");
  const [officer, setOfficer] = useState("all");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await groupsService.getGroups();
      setGroups(data);
      setLoading(false);
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (query.trim() && !g.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (officer !== "all" && officer !== "ops") return true;

      if (view === "active-loans" && !g.hasActiveLoans) return false;
      if (view === "active-deposits" && !g.hasActiveDeposits) return false;
      if (view === "sin-cuentas-activas" && (g.hasActiveLoans || g.hasActiveDeposits)) return false;
      if (view === "sin-miembros" && g.membersCount !== 0) return false;
      return true;
    });
  }, [groups, query, officer, view]);

  const title = (() => {
    if (view === "active-loans") return t("groups.list.activeLoans");
    if (view === "active-deposits") return t("groups.list.activeDeposits");
    if (view === "sin-cuentas-activas") return t("groups.list.noActiveAccounts");
    if (view === "sin-miembros") return t("groups.list.noMembers");
    return t("groups.list.allGroups");
  })();

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">{title}</h1>

          <div className="zelify-groups-toolbar">
            <div className="zelify-groups-toolbar__search-wrap">
              <label className="zelify-groups-toolbar__search-label" htmlFor="groups-search">
                {t("groups.list.searchLabel")}
              </label>
              <AppInput
                id="groups-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("groups.list.searchPlaceholder")}
              />
            </div>
            <select
              className="zelify-groups-toolbar__select"
              value={officer}
              onChange={(e) => setOfficer(e.target.value)}
            >
              <option value="all">{t("groups.list.allOfficers")}</option>
              <option value="ops">{t("groups.list.operationsTeam")}</option>
            </select>
          </div>

          {loading ? (
            <div className="zelify-workspace-page__loading">
              <div className="zelify-workspace-page__spinner" aria-hidden />
              <span>{t("groups.list.loading")}</span>
            </div>
          ) : (
            <GroupTable groups={filtered} />
          )}
        </div>
      </div>
    </div>
  );
}
