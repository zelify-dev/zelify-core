"use client";

import Link from "next/link";
import { type Customer, mockCustomers } from "@/mocks/customers";
import { AppAvatar } from "@/components/ui/atoms/avatar/app-avatar";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { AppButton } from "@/components/ui/atoms/button/app-button";

import "./customers-table.css";

export function CustomersTable() {
  const getStatusType = (state: string) => {
    switch (state) {
      case "Active": return "success";
      case "In Arrears": return "error";
      case "Blacklisted": return "error";
      case "Pending Approval": return "warning";
      default: return "neutral";
    }
  };

  return (
    <div className="zelify-customers-table-container">
      <table className="zelify-customers-table">
        <thead>
          <tr>
            <th>Full Name</th>
            <th>ID</th>
            <th>State</th>
            <th>Credit Officer</th>
            <th>Total Balance</th>
            <th>Last Modified</th>
          </tr>
        </thead>
        <tbody>
          {mockCustomers.map((customer) => (
            <tr key={customer.id}>
              <td>
                <Link href={`/customers/${customer.id}`} className="zelify-customers-table__name-cell">
                  <AppAvatar initials={customer.fullName.split(" ").map(n => n[0]).join("")} className="zelify-customers-table__avatar" />
                  <span>{customer.fullName}</span>
                </Link>
              </td>
              <td>
                <span className="zelify-mono">{customer.id}</span>
              </td>
              <td>
                <AppBadge tone={getStatusType(customer.state)} size="sm">
                  {customer.state.toUpperCase()}
                </AppBadge>
              </td>
              <td>{customer.creditOfficer}</td>
              <td>
                <span className="zelify-mono">
                  {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(customer.totalBalance)}
                </span>
              </td>
              <td>{customer.lastModified}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="zelify-table-pagination">
        <div className="zelify-table-pagination__info">
          Showing <strong>1-3</strong> of <strong>3</strong> results
        </div>
        <div className="zelify-table-pagination__controls">
          <AppButton tone="secondary" className="zelify-button--sm" disabled>Previous</AppButton>
          <div className="zelify-table-pagination__pages">
            <button className="zelify-pagination-btn is-active">1</button>
          </div>
          <AppButton tone="secondary" className="zelify-button--sm" disabled>Next</AppButton>
        </div>
      </div>
    </div>
  );
}
