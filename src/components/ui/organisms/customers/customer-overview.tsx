"use client";

import { type Customer } from "@/mocks/customers";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";

type CustomerOverviewProps = {
  customer: Customer;
};

export function CustomerOverview({ customer }: CustomerOverviewProps) {
  const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" });

  return (
    <div className="zelify-customer-overview">
      <section className="zelify-panel zelify-customer-overview__accounts">
        <div className="zelify-panel__header">
          <h2 className="zelify-panel__title">Accounts Summary</h2>
        </div>
        <SettingsDataTable variant="accounts">
          <thead>
            <tr>
              <th>Account name</th>
              <th>Type</th>
              <th>State</th>
              <th className="is-numeric-header">Balance</th>
            </tr>
          </thead>
          <tbody>
            {customer.accounts.map((acc) => (
              <tr key={acc.id}>
                <td>
                  <div className="zelify-customer-overview__account-name">
                    <strong>{acc.name}</strong>
                    <span className="zelify-mono">{acc.id}</span>
                  </div>
                </td>
                <td>{acc.type}</td>
                <td>
                  <AppBadge tone={acc.state === "In Arrears" ? "error" : "success"} size="sm">
                    {acc.state.toUpperCase()}
                  </AppBadge>
                </td>
                <td className="is-numeric">{currency.format(acc.balance)}</td>
              </tr>
            ))}
            <tr className="is-total">
              <td colSpan={3}>
                <strong>Total</strong>
              </td>
              <td className="is-numeric">
                <strong>{currency.format(customer.totalBalance)}</strong>
              </td>
            </tr>
          </tbody>
        </SettingsDataTable>
      </section>

      <div className="zelify-customer-overview__info-grid">
        <section className="zelify-panel">
          <div className="zelify-panel__header">
            <h2 className="zelify-panel__title">General</h2>
          </div>
          <dl className="zelify-info-list">
            <div className="zelify-info-list__item">
              <dt>ID</dt>
              <dd className="zelify-mono">{customer.id}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Client Type</dt>
              <dd>{customer.clientType}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Branch</dt>
              <dd>{customer.branch}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Centre</dt>
              <dd>{customer.assignedCentre}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Credit Officer</dt>
              <dd>{customer.creditOfficer}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Created</dt>
              <dd>{customer.createdDate}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Status</dt>
              <dd>{customer.state}</dd>
            </div>
          </dl>
        </section>

        <section className="zelify-panel">
          <div className="zelify-panel__header">
            <h2 className="zelify-panel__title">Personal & Contact</h2>
          </div>
          <dl className="zelify-info-list">
            <div className="zelify-info-list__group">Personal</div>
            <div className="zelify-info-list__item">
              <dt>Gender</dt>
              <dd>{customer.personalInfo.gender}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Birth Date</dt>
              <dd>{customer.personalInfo.birthDate}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Language</dt>
              <dd>{customer.personalInfo.preferredLanguage}</dd>
            </div>
            <div className="zelify-info-list__group">Contact</div>
            <div className="zelify-info-list__item">
              <dt>Phone</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Email</dt>
              <dd>{customer.email}</dd>
            </div>
            <div className="zelify-info-list__item">
              <dt>Address</dt>
              <dd>{customer.personalInfo.address}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
