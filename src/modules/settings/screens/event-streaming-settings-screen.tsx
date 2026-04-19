"use client";

import { AppButton } from "@/components/ui/atoms/button/app-button";
import { FinancialTableRowActions } from "@/modules/settings/components/financial-table-row-actions/financial-table-row-actions";
import { SettingsDataTable } from "@/components/ui/organisms/settings-data-table/settings-data-table";
import { mockAdminEventStreamingRows } from "../data/admin-event-streaming.mock";

import "./event-streaming-settings-screen.css";

export function EventStreamingSettingsScreen() {
  return (
    <div className="zelify-event-streaming-settings">
      <div className="zelify-event-streaming-settings__table-wrap">
        <SettingsDataTable variant="clients" className="zelify-event-streaming-settings__data-table">
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
            {mockAdminEventStreamingRows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <div className="zelify-event-streaming-settings__event-cell">
                    <span className="zelify-event-streaming-settings__event-title">{row.eventTitle}</span>
                    {row.eventMeta ? (
                      <span className="zelify-event-streaming-settings__event-meta">{row.eventMeta}</span>
                    ) : null}
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

      <div className="zelify-event-streaming-settings__footer-actions">
        <AppButton type="button" tone="primary">
          Add Notification
        </AppButton>
      </div>
    </div>
  );
}
