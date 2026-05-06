"use client";

import { use, useEffect, useState } from "react";
import { notFound } from "next/navigation";
import { CustomerProfileHeader } from "@/components/ui/organisms/customers/customer-profile-header";
import { CustomerOverview } from "@/components/ui/organisms/customers/customer-overview";
import { CustomerActivityFeed } from "@/components/ui/organisms/customers/customer-activity-feed";
import { WorkspaceShell } from "@/components/ui/templates/workspace-shell/workspace-shell";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { customersService } from "@/modules/customers/services/customers.service";
import type { Customer as ListCustomer } from "@/modules/customers/types/customer.types";
import { resolveCustomerProfile } from "@/modules/customers/services/customer-profile-resolver";
import "./customer-detail-page.css";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

type TabId = "overview" | "products" | "attachments" | "tasks" | "communications" | "comments";

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { customerId } = use(params);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [listCustomers, setListCustomers] = useState<ListCustomer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    customersService
      .getCustomers()
      .then((data) => {
        if (!mounted) return;
        setListCustomers(data);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const customer = resolveCustomerProfile(customerId, listCustomers);

  if (loading) {
    return (
      <WorkspaceShell>
        <main className="zelify-home zelify-home--customer-detail">
          <div className="zelify-home__content zelify-home__content--customer-detail">
            <p>Cargando cliente...</p>
          </div>
        </main>
      </WorkspaceShell>
    );
  }

  if (!customer) {
    notFound();
  }

  const documents = [
    "Documento de identidad - verificado",
    "Comprobante de domicilio - vigente",
    "Declaración de origen de fondos - aprobada",
  ];
  const tasks = [
    `Revisión trimestral de perfil de riesgo (${customer.branch})`,
    `Validar datos de contacto con oficial ${customer.creditOfficer}`,
  ];
  const communications = [
    `Correo enviado: Estado de productos (${customer.email})`,
    `SMS enviado: Confirmación de actividad en cuenta (${customer.phone})`,
  ];
  const notes = [
    `Cliente asignado al centro ${customer.assignedCentre}.`,
    customer.state === "In Arrears"
      ? "Seguimiento semanal activo por mora."
      : "Sin alertas críticas en monitoreo transaccional.",
  ];
  const tabs: { id: TabId; label: string; visible: boolean }[] = [
    { id: "overview", label: "Resumen", visible: true },
    { id: "products", label: `Productos (${customer.accounts.length})`, visible: customer.accounts.length > 0 },
    { id: "attachments", label: "Documentos", visible: documents.length > 0 },
    { id: "tasks", label: "Tareas", visible: tasks.length > 0 },
    { id: "communications", label: "Comunicaciones", visible: communications.length > 0 },
    { id: "comments", label: "Notas", visible: notes.length > 0 },
  ].filter((tab) => tab.visible);

  const renderSimpleListCard = (title: string, items: string[]) => (
    <section className="zelify-panel zelify-customer-detail-card">
      <div className="zelify-panel__header">
        <h2 className="zelify-panel__title">{title}</h2>
      </div>
      <ul className="zelify-customer-detail-list">
        {items.map((item) => (
          <li key={item} className="zelify-customer-detail-list__item">
            <span className="zelify-customer-detail-list__dot" aria-hidden />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <WorkspaceShell>
      <main className="zelify-home zelify-home--customer-detail">
        <div className="zelify-home__content zelify-home__content--customer-detail">
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
              {activeTab === "products" && (
                <section className="zelify-panel zelify-customer-detail-card">
                  <div className="zelify-panel__header">
                    <h2 className="zelify-panel__title">Productos Financieros</h2>
                  </div>
                  <SettingsDataTable variant="accounts">
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Tipo</th>
                        <th>Estado</th>
                        <th className="is-numeric-header">Saldo USD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customer.accounts.map((acc) => (
                        <tr key={acc.id}>
                          <td>
                            <strong>{acc.name}</strong>
                            <div className="zelify-mono">{acc.id}</div>
                          </td>
                          <td>{acc.type}</td>
                          <td>
                            <AppBadge tone={acc.state === "In Arrears" ? "error" : "success"} size="sm">
                              {acc.state}
                            </AppBadge>
                          </td>
                          <td className="is-numeric">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(acc.balance)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </SettingsDataTable>
                </section>
              )}
              {activeTab === "attachments" && (
                renderSimpleListCard("Documentos KYC", documents)
              )}
              {activeTab === "tasks" && (
                renderSimpleListCard("Tareas Operativas", tasks)
              )}
              {activeTab === "communications" && (
                renderSimpleListCard("Comunicaciones", communications)
              )}
              {activeTab === "comments" && (
                renderSimpleListCard("Notas Internas", notes)
              )}
            </div>

            <CustomerActivityFeed events={customer.activity} />
          </div>
        </div>
      </main>
    </WorkspaceShell>
  );
}
