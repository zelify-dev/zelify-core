"use client";

import { useSearchParams } from "next/navigation";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import { SandboxBanner } from "@/modules/customers/components/sandbox-banner";

import "@/components/ui/templates/workspace-page.css";
import "./reports-screen.css";

const ORG_KPIS = [
  { label: "Total Clientes", value: "12,420" },
  { label: "Cartera Bruta", value: "$42,581,900" },
  { label: "PAR>30", value: "4.8%" },
];

const PRODUCT_COMPOSITION = [
  { name: "Microcrédito", value: 46 },
  { name: "PYME", value: 32 },
  { name: "Consumo", value: 22 },
];

const DISBURSEMENT_RECOVERY = [
  { month: "Ene", disbursement: 140, recovery: 110 },
  { month: "Feb", disbursement: 132, recovery: 118 },
  { month: "Mar", disbursement: 150, recovery: 131 },
  { month: "Abr", disbursement: 170, recovery: 142 },
];

const OUTREACH = [
  { zone: "Rural", value: 58 },
  { zone: "Urbana", value: 42 },
];

export function ReportsScreen() {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");
  const isOrg = view === "organization";
  const isOutreach = view === "outreach";

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">
            {isOrg ? "Reporting - Organization" : isOutreach ? "Reporting - Outreach" : "Reporting"}
          </h1>

          {isOrg ? (
            <>
              <div className="zelify-report-kpi-grid">
                {ORG_KPIS.map((kpi) => (
                  <article key={kpi.label} className="zelify-report-card">
                    <span>{kpi.label}</span>
                    <strong>{kpi.value}</strong>
                  </article>
                ))}
              </div>

              <div className="zelify-report-charts">
                <article className="zelify-report-card">
                  <h3>Composición de Cartera por Producto</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={PRODUCT_COMPOSITION} dataKey="value" nameKey="name" outerRadius={95}>
                        {PRODUCT_COMPOSITION.map((_, i) => (
                          <Cell key={i} fill={["#3b82f6", "#6366f1", "#14b8a6"][i]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </article>

                <article className="zelify-report-card">
                  <h3>Desembolsos vs Recuperación Mensual</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={DISBURSEMENT_RECOVERY}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="disbursement" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="recovery" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </article>
              </div>
            </>
          ) : null}

          {isOutreach ? (
            <>
              <div className="zelify-report-kpi-grid">
                <article className="zelify-report-card">
                  <span>% Mujeres en Cartera</span>
                  <strong>61%</strong>
                </article>
                <article className="zelify-report-card">
                  <span>Edad Promedio del Cliente</span>
                  <strong>36.4 años</strong>
                </article>
              </div>

              <article className="zelify-report-card">
                <h3>Distribución por Zona Geográfica (Rural vs Urbana)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart layout="vertical" data={OUTREACH}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="zone" width={90} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1d4ed8" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </article>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

