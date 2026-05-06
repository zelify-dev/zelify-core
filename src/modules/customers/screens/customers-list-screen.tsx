"use client";

import React, { useEffect, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { Button } from "tamagui";
import { SandboxBanner } from "../components/sandbox-banner";
import { CustomerTable } from "../components/customer-table";
import { CreateClientModal } from "../components/create-client-modal";
import { customersService } from "../services/customers.service";
import { Customer } from "../types/customer.types";
import { useI18n } from "@/providers/i18n-provider";

export const CustomersListScreen: React.FC = () => {
  useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const data = await customersService.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();
  }, []);

  const openCreate = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const openEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleSave = async (customer: Customer) => {
    if (editingCustomer) {
      const updated = await customersService.updateCustomer(editingCustomer.id, customer);
      setCustomers((prev) => prev.map((c) => (c.id === editingCustomer.id ? updated : c)));
    } else {
      const created = await customersService.createCustomer(customer);
      setCustomers((prev) => [created, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    await customersService.deleteCustomer(id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h1 className="zelify-workspace-page__title">Clientes individuales</h1>
            <Button theme="green" onPress={openCreate}>
              Crear cliente
            </Button>
          </div>

          <div className="zelify-workspace-page__stack">
            {loading ? (
              <div className="zelify-workspace-page__loading">
                <div className="zelify-workspace-page__spinner" aria-hidden />
                <span>Cargando clientes...</span>
              </div>
            ) : (
              <CustomerTable customers={customers} onEdit={openEdit} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>

      <CreateClientModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        mode={editingCustomer ? "edit" : "create"}
        initialCustomer={editingCustomer}
        onSave={handleSave}
      />
    </div>
  );
};
