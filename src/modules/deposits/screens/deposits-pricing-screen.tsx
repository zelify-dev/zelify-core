"use client";

import { useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";
import { ScotiaDemoSection, useScotiaDemoMode, type ScotiaDemoTab } from "@/modules/lim/components/lim-scotiabank-demo";
import { ScotiaSectionHeader } from "@/modules/scotia/components/scotia-section-header";

import "@/components/ui/templates/workspace-page.css";
import "@/modules/lim/screens/lim-screen.css";

export function DepositsPricingScreen() {
  const scotia = useScotiaDemoMode();
  const [activeModule, setActiveModule] = useState<ScotiaDemoTab>("pricing");

  const handleModuleChange = (tab: ScotiaDemoTab) => {
    if (tab === "pricing" || tab === "tesoreria" || tab === "trazabilidad") {
      setActiveModule(tab);
    }
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="lim-root zelify-workspace-page__inner">
          <div className="lim-panel scotia-workspace scotia-card" style={{ marginBottom: 16 }}>
            <ScotiaSectionHeader
              badge="LCC · Depósitos"
              title="Depósitos"
              subtitle="Motor unificado de pricing, tesorería y trazabilidad."
            />
            <div className="lim-subbar" style={{ marginTop: 12 }}>
              <div className="lim-subbar-left">
                <label htmlFor="deposits-view-filter" style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>Filtro</label>
                <select
                  id="deposits-view-filter"
                  className="lim-sel"
                  value={activeModule}
                  onChange={(e) => handleModuleChange(e.target.value as ScotiaDemoTab)}
                >
                  <option value="pricing">Depósitos · Pricing</option>
                  <option value="tesoreria">Depósitos · Tesorería</option>
                  <option value="trazabilidad">Depósitos · Trazabilidad</option>
                </select>
              </div>
            </div>
          </div>
          <ScotiaDemoSection
            activeTab={activeModule}
            creditCategory={scotia.creditCategory}
            selectedClient={scotia.selectedClient}
            onSelectedClientChange={scotia.setSelectedClient}
            limStore={scotia.limStore}
            creditStore={scotia.creditStore}
            onTabChange={handleModuleChange}
          />
        </div>
      </div>
    </div>
  );
}
