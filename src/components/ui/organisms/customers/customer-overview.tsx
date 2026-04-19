"use client";

import { type Customer } from "@/mocks/customers";
import { AppBadge } from "@/components/ui/atoms/badge/app-badge";

type CustomerOverviewProps = {
  customer: Customer;
};

export function CustomerOverview({ customer }: CustomerOverviewProps) {
  return (
    <div className="zelify-customer-overview">
      <section className="zelify-panel zelify-customer-overview__accounts">
        <div className="zelify-panel__header">
          <h2 className="zelify-panel__title">Accounts Summary</h2>
        </div>
        <div className="zelify-accounts-table-wrapper">
          <table className="zelify-accounts-table">
            <thead>
              <tr>
                <th>Account Name</th>
                <th>Type</th>
                <th>State</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {customer.accounts.map((acc) => (
                <tr key={acc.id}>
                  <td>
                    <div className="zelify-accounts-table__name">
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
                  <td>
                    <span className="zelify-mono">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(acc.balance)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="zelify-accounts-table__total">
                 <td colSpan={3}><strong>Total</strong></td>
                 <td>
                    <strong className="zelify-mono">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "EUR" }).format(customer.totalBalance)}
                    </strong>
                 </td>
              </tr>
            </tbody>
          </table>
        </div>
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
