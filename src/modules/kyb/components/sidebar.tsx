"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeftIcon, CloseIcon } from "@/modules/kyb/components/icons";
import { SidebarItem } from "@/modules/kyb/components/sidebar-item";
import { useOnboarding } from "@/modules/kyb/components/onboarding-provider";
import { onboardingNavigation } from "@/modules/kyb/lib/onboarding-config";
import { Building2, Users, ArrowLeft } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const {
    progress,
    isSidebarCollapsed,
    isMobileSidebarOpen,
    toggleSidebar,
    closeMobileSidebar,
    user,
    isAuditMode,
    auditOrganizationId,
    organizationsList,
    stopAudit,
  } = useOnboarding();

  const isAdmin = user?.role === "admin_zelify";
  const isOnAdminSection = pathname.startsWith("/admin");
  const showAuditSidebar = isAdmin && isAuditMode;
  const showAdminOperations = isAdmin && !isAuditMode && isOnAdminSection;
  const showOnboardingNav = !isAdmin || showAuditSidebar || !isOnAdminSection;

  const auditedOrg = isAuditMode
    ? organizationsList.find((org) => org.id === auditOrganizationId)
    : null;
  const auditedOrgName = auditedOrg ? auditedOrg.legalName : "Expediente B2B";

  return (
    <>
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-950/25 transition-opacity duration-200 lg:hidden",
          isMobileSidebarOpen ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={closeMobileSidebar}
      />

      <aside
        className={[
          "zelify-kyb-sidebar fixed left-0 z-40 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 lg:translate-x-0",
          isSidebarCollapsed ? "w-[80px]" : "w-[280px]",
          isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-20 items-center border-b border-slate-100 px-5">
          <div className="flex min-w-0 items-center gap-3">
            {isSidebarCollapsed ? (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100/60">
                <img src="/logo-icon.svg" alt="Zelify Icon" className="h-5 w-auto" />
              </div>
            ) : (
              <div className="flex items-center gap-3 min-w-0">
                <img src="/zelifyLogo_dark.svg" alt="Zelify Logo" className="h-6 w-auto" />
                <span className="h-4 w-[1px] bg-slate-200"></span>
                <span className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {isAdmin ? "ADMIN" : "KYB"}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="ml-auto rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 lg:hidden"
            aria-label="Cerrar sidebar"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-4 py-6">
          {/* MODO AUDITORÍA ACTIVO PARA ADMIN */}
          {showAuditSidebar ? (
            <div className="space-y-6">
              {!isSidebarCollapsed && (
                <div className="space-y-3 px-3">
                  <button
                    onClick={stopAudit}
                    className="flex w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ArrowLeft className="h-4.5 w-4.5 text-slate-500" size={16} />
                    <span>Volver al Panel</span>
                  </button>
                  <div className="pt-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                      AUDITANDO
                    </p>
                    <p className="mt-1 truncate text-xs font-bold text-slate-700">
                      {auditedOrgName}
                    </p>
                  </div>
                </div>
              )}

              {isSidebarCollapsed && (
                <div className="flex justify-center px-1 mb-4">
                  <button
                    onClick={stopAudit}
                    title="Volver al Panel"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  >
                    <ArrowLeft size={16} />
                  </button>
                </div>
              )}

              <div>
                {!isSidebarCollapsed && (
                  <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                    EXPEDIENTE
                  </p>
                )}
                <nav className="space-y-2">
                  {onboardingNavigation.items.map((item) => (
                    <SidebarItem
                      key={item.href}
                      item={item}
                      percent={item.percentKey ? progress[item.percentKey] : 0}
                      collapsed={isSidebarCollapsed}
                      onNavigate={closeMobileSidebar}
                    />
                  ))}
                </nav>
              </div>
            </div>
          ) : showAdminOperations ? (
            /* MODO CONTROL GENERAL DE ADMIN (CRUD ORGANIZATIONS Y CRUD USERS) */
            <div className="space-y-6">
              {!isSidebarCollapsed && (
                <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  OPERACIONES
                </p>
              )}

              <nav className="space-y-2">
                <Link
                  href="/admin/organizations"
                  onClick={closeMobileSidebar}
                  className={[
                    "flex items-center rounded-xl border px-3 py-2.5 transition-all duration-200",
                    isSidebarCollapsed ? "justify-center" : "justify-between gap-3",
                    pathname.startsWith("/admin/organizations")
                      ? "border-slate-200/80 bg-slate-50 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      : "border-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50/50 hover:text-slate-800",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                        pathname.startsWith("/admin/organizations")
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100/60 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500",
                      ].join(" ")}
                    >
                      <Building2 size={18} />
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold tracking-wide uppercase">
                          1. Gestión de Empresas
                        </span>
                      </span>
                    )}
                  </span>
                </Link>

                <Link
                  href="/admin/users"
                  onClick={closeMobileSidebar}
                  className={[
                    "flex items-center rounded-xl border px-3 py-2.5 transition-all duration-200",
                    isSidebarCollapsed ? "justify-center" : "justify-between gap-3",
                    pathname.startsWith("/admin/users")
                      ? "border-slate-200/80 bg-slate-50 text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      : "border-transparent text-slate-500 hover:border-slate-100 hover:bg-slate-50/50 hover:text-slate-800",
                  ].join(" ")}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={[
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                        pathname.startsWith("/admin/users")
                          ? "bg-slate-900 text-white"
                          : "bg-slate-100/60 text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-500",
                      ].join(" ")}
                    >
                      <Users size={18} />
                    </span>
                    {!isSidebarCollapsed && (
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold tracking-wide uppercase">
                          2. Gestión de Usuarios
                        </span>
                      </span>
                    )}
                  </span>
                </Link>
              </nav>
            </div>
          ) : showOnboardingNav ? (
            /* ONBOARDING (CLIENTE O ADMIN EN EXPEDIENTE) */
            <>
              {!isSidebarCollapsed && (
                <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {isAdmin ? "EXPEDIENTE" : onboardingNavigation.label}
                </p>
              )}

              <nav className="space-y-2">
                {onboardingNavigation.items.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    percent={item.percentKey ? progress[item.percentKey] : 0}
                    collapsed={isSidebarCollapsed}
                    onNavigate={closeMobileSidebar}
                  />
                ))}
              </nav>

            </>
          ) : null}
        </div>

        <div className="hidden lg:block">
          <button
            type="button"
            onClick={toggleSidebar}
            className="absolute -right-4 top-6 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-slate-900"
            aria-label={isSidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <ChevronLeftIcon
              className={[
                "h-4 w-4 transition-transform duration-300",
                isSidebarCollapsed ? "rotate-180" : "",
              ].join(" ")}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
