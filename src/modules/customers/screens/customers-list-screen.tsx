"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ZelifyTopNavbar } from "@/components/ui/organisms/topbar/zelify-top-navbar";
import "@/components/ui/templates/workspace-page.css";
import { SandboxBanner } from "../components/sandbox-banner";
import { CustomerFilters } from "../components/customer-filters";
import { CustomerTable } from "../components/customer-table";
import { ColumnPresets } from "../components/column-presets";
import { InactiveCustomersView } from "../components/inactive-customers-view";
import { BlacklistCustomersView } from "../components/blacklist-customers-view";
import { customersService } from "../services/customers.service";
import { Customer } from "../types/customer.types";
import { useI18n } from "@/providers/i18n-provider";

function DefaultCustomersListView() {
  const { t } = useI18n();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="zelify-workspace-page">
      <ZelifyTopNavbar />
      <SandboxBanner />

      <div className="zelify-workspace-page__scroll">
        <div className="zelify-workspace-page__inner">
          <h1 className="zelify-workspace-page__title">{t("nav.top.clients")}</h1>

          <div className="zelify-workspace-page__stack">
            <CustomerFilters />

            {loading ? (
              <div className="zelify-workspace-page__loading">
                <div className="zelify-workspace-page__spinner" aria-hidden />
                <span>{t("customers.list.loading")}</span>
              </div>
            ) : (
              <CustomerTable customers={customers} />
            )}

            <ColumnPresets />
          </div>
        </div>
      </div>
    </div>
  );
}

export const CustomersListScreen: React.FC = () => {
  const searchParams = useSearchParams();
  const view = searchParams.get("view");

  if (view === "inactive") {
    return <InactiveCustomersView />;
  }

  if (view === "blacklist") {
    return <BlacklistCustomersView />;
  }

  return <DefaultCustomersListView />;
};
