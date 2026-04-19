"use client";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { mockAdminWebhooksNotifications } from "../data/admin-webhooks.mock";

import "./webhooks-notifications-screen.css";

export function WebhooksNotificationsScreen() {
  return (
    <div className="zelify-webhooks-notifications">
      <div className="zelify-webhooks-notifications__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-webhooks-notifications__data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Event</th>
              <th>State</th>
              <th>Status</th>
              <th>Options</th>
              <th className="zelify-settings-data-table__actions-col"> </th>
            </tr>
          </thead>
          <tbody>
            {mockAdminWebhooksNotifications.map((row) => (
              <tr key={row.id}>
                <td className="zelify-webhooks-notifications__name">{row.name}</td>
                <td>
                  <div className="zelify-webhooks-notifications__event-cell">
                    <span className="zelify-webhooks-notifications__event-title">{row.eventTitle}</span>
                    <span className="zelify-webhooks-notifications__event-desc">{row.eventDescription}</span>
                  </div>
                </td>
                <td>{row.state}</td>
                <td>{row.status}</td>
                <td>{row.options}</td>
                <td className="is-actions">
                  <FinancialTableRowActions rowLabel={row.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </SettingsDataTable>
      </div>

      <div className="zelify-webhooks-notifications__footer-actions">
        <AppButton type="button" tone="primary">
          Add Notification
        </AppButton>
      </div>
    </div>
  );
}
