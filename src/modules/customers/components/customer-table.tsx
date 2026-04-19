"use client";

import React from "react";

import "./customer-table.css";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { Customer, ClientState } from "../types/customer.types";

interface CustomerTableProps {
  customers: Customer[];
}

export const CustomerTable: React.FC<CustomerTableProps> = ({ customers }) => {
  return (
    <div className="zelify-customer-table">
      <SettingsDataTable variant="clients">
        <thead>
          <tr>
            <th>Full name</th>
            <th>ID</th>
            <th>Client state</th>
            <th>Credit officer</th>
            <th className="is-numeric-header">Total balance</th>
            <th className="is-numeric-header">Last modified</th>
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
                  {formatStateLabel(customer.state)}
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
          <span className="zelify-data-table-footer__info">Show</span>
          <span className="zelify-data-table-footer__page-size-value">25</span>
        </div>
        <div className="zelify-data-table-footer__controls">
          <span className="zelify-data-table-footer__info">All {customers.length}</span>
          <div className="zelify-data-table-footer__pages">
            <button type="button" className="zelify-pagination-btn" disabled aria-label="Previous page">
              <ChevronLeft size={16} strokeWidth={2} />
            </button>
            <button type="button" className="zelify-pagination-btn" disabled aria-label="Next page">
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

function formatStateLabel(state: ClientState): string {
  const words = state.split("_").map((w) => w.charAt(0) + w.slice(1).toLowerCase());
  return words.join(" ");
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
  const formatted = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));

  return amount < 0 ? `€-${formatted.replace("€", "").trim()}` : formatted;
};
