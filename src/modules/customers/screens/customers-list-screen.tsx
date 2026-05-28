"use client";

import React, { useEffect, useState } from "react";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { Button, Dialog } from "tamagui";
import { Copy } from "lucide-react";
import { SandboxBanner } from "../components/sandbox-banner";
import { CustomerTable } from "../components/customer-table";
import { CreateClientModal } from "../components/create-client-modal";
import { customersService } from "../services/customers.service";
import { registerZelifyCustomerForLcc } from "@/modules/scotia/services/lcc-customer-sync";
import { Customer } from "../types/customer.types";
import { useI18n } from "@/providers/i18n-provider";

export const CustomersListScreen: React.FC = () => {
  useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [onboardingLink, setOnboardingLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

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
    setCopied(false);
    setIsCopyModalOpen(false);
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
      registerZelifyCustomerForLcc({
        ...customer,
        createdAt: customer.createdAt ?? new Date().toISOString(),
      });
      try {
        const created = await customersService.createCustomer(customer);
        registerZelifyCustomerForLcc({
          ...created,
          createdAt: created.createdAt ?? customer.createdAt ?? new Date().toISOString(),
        });
        setCustomers((prev) => [created, ...prev]);
        setOnboardingLink("https://pegalo-zelify.vercel.app/kyc-zelify?start=identity");
        setCopied(false);
      } catch (error) {
        console.error("Error creating customer:", error);
        setCustomers((prev) => [customer, ...prev]);
        setOnboardingLink("https://pegalo-zelify.vercel.app/kyc-zelify?start=identity");
        setCopied(false);
      }
    }
  };

  const copyOnboardingLink = async () => {
    if (!onboardingLink) return;
    try {
      await navigator.clipboard.writeText(onboardingLink);
      setCopied(true);
      setIsCopyModalOpen(true);
    } catch (error) {
      console.error("Error copying onboarding link:", error);
      setCopied(false);
      setIsCopyModalOpen(true);
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

          {onboardingLink ? (
            <div
              style={{
                marginTop: 10,
                border: "1px solid rgba(16, 185, 129, 0.32)",
                background: "#ECFDF5",
                borderRadius: 12,
                padding: "12px 14px",
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 10,
              }}
            >
              <strong style={{ color: "#065F46" }}>Usuario creado correctamente.</strong>
              <span style={{ color: "#065F46" }}>Link de onboarding:</span>
              <button
                type="button"
                onClick={copyOnboardingLink}
                style={{
                  border: 0,
                  background: "transparent",
                  color: "#1D4ED8",
                  fontWeight: 700,
                  textDecoration: "underline",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Link
              </button>
            </div>
          ) : null}

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

      <Dialog modal open={isCopyModalOpen} onOpenChange={setIsCopyModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay backgroundColor="#020617" opacity={0.45} />
          <Dialog.Content width={360} maxWidth="90vw" gap="$3" padding="$4">
            <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
              <Copy size={34} color="#1D4ED8" />
            </div>
            <Dialog.Title textAlign="center">Enlace de onboarding</Dialog.Title>
            <Dialog.Description textAlign="center">
              {copied ? "Link copiado al portapapeles." : "No se pudo copiar el link. Intenta de nuevo."}
            </Dialog.Description>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Dialog.Close asChild>
                <Button>Cerrar</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </div>
  );
};
