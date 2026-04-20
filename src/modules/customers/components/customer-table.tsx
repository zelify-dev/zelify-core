"use client";

import React from "react";

import "./customer-table.css";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { Customer, ClientState } from "../types/customer.types";
import { useI18n } from "@/providers/i18n-provider";

interface CustomerTableProps {
  customers: Customer[];
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  const { t } = useI18n();

  return (
    <div className="zelify-customer-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>{t("customers.list.columns.fullName")}</th>
            <th>{t("customers.list.columns.id")}</th>
            <th>{t("customers.list.columns.clientState")}</th>
            <th>{t("customers.list.columns.creditOfficer")}</th>
            <th className="is-numeric-header">{t("customers.list.columns.totalBalance")}</th>
            <th className="is-numeric-header">{t("customers.list.columns.lastModified")}</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Link href={`/customers/${customer.id}`} className="zelify-customer-table__name-link">
                  <AppAvatar
                    initials={initialsFromName(customer.fullName)}
                    className="zelify-customer-table__avatar"
                  />
                  <span>{customer.fullName}</span>
                </Link>
              </td>
              <td>
                <span className="zelify-mono">{customer.id}</span>
              </td>
              <td>
                <AppBadge tone={clientStateToTone(customer.state)} size="sm">
                  {clientStateLabel(customer.state, t)}
                </AppBadge>
              </td>
              <td>{customer.creditOfficer || "—"}</td>
              <td className="is-numeric">
                <span
                  className={
                    customer.totalBalance < 0 ? "zelify-table-balance--negative" : undefined
                  }
                >
                  {formatCurrency(customer.totalBalance)}
                </span>
              </td>
              <td className="is-numeric">{customer.lastModified}</td>
            </tr>
          ))}
        </tbody>
      </SettingsDataTable>

      <div className="zelify-data-table-footer">
        <div className="zelify-data-table-footer__page-size">
          <span className="zelify-data-table-footer__info">{t("customers.common.show")}</span>
          <span className="zelify-data-table-footer__page-size-value">25</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">
            {t("customers.common.allCount").replace("{count}", String(customers.length))}
          </span>
          <div className="zelify-data-table-footer__pages">
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("customers.common.prevPageAria")}
            >
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button
              type="button"
              className="zelify-pagination-btn"
              disabled
              aria-label={t("customers.common.nextPageAria")}
            >
              <ChevronRight size={16} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function initialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type TFn = (key: string) => string;

function clientStateLabel(state: ClientState, t: TFn): string {
  switch (state) {
    case ClientState.ACTIVE:
      return t("customers.list.clientStates.active");
    case ClientState.INACTIVE:
      return t("customers.list.clientStates.inactive");
    case ClientState.BLACKLISTED:
      return t("customers.list.clientStates.blacklisted");
    case ClientState.PENDING:
      return t("customers.list.clientStates.pending");
    default:
      return state;
  }
}

function clientStateToTone(state: ClientState): "success" | "error" | "warning" | "neutral" {
  switch (state) {
    case ClientState.ACTIVE:
      return "success";
    case ClientState.INACTIVE:
      return "warning";
    case ClientState.BLACKLISTED:
      return "error";
    case ClientState.PENDING:
      return "neutral";
    default:
      return "neutral";
  }
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
};
