import type { SystemActivityRow } from "../types/system-activity.types";

/** Total según referencia Figma (paginación “1 – 50 of 865”). */
export const SYSTEM_ACTIVITIES_TOTAL = 865;

const SAMPLE_ROWS: Omit<SystemActivityRow, "id">[] = [
  {
    creationDate: "30-07-2025",
    user: "Valerio Ferrari",
    action: "Deposit Account Edited",
    affectedItemName: "Test Fix Deposit",
    affectedItemId: "TEST_FIX",
    affectedClientName: "Roger Federer",
  },
  {
    creationDate: "29-07-2025",
    user: "Valerio Ferrari",
    action: "User Logged In",
    affectedItemName: "Verify Balance",
    affectedItemId: "MRHX261",
    affectedClientName: "Lewis Hamilton",
  },
  {
    creationDate: "28-07-2025",
    user: "Andrea Molina",
    action: "Task Completed",
    affectedItemName: "Monthly reconciliation",
    affectedItemId: "TASK-8821",
    affectedClientName: "Andean Treasury Group",
  },
  {
    creationDate: "27-07-2025",
    user: "Juan Carlos",
    action: "Loan Terms Updated",
    affectedItemName: "Operating Loan",
    affectedItemId: "LN-449210",
    affectedClientName: "Roger Federer",
  },
  {
    creationDate: "26-07-2025",
    user: "System",
    action: "Scheduled Job Completed",
    affectedItemName: "EOD Posting",
    affectedItemId: "EOD-20250726",
    affectedClientName: "—",
  },
];

export function getSystemActivitiesSlice(
  page: number,
  pageSize: number
): SystemActivityRow[] {
  const start = (page - 1) * pageSize;
  const out: SystemActivityRow[] = [];
  for (let i = 0; i < pageSize && start + i < SYSTEM_ACTIVITIES_TOTAL; i++) {
    const idx = start + i;
    const base = SAMPLE_ROWS[idx % SAMPLE_ROWS.length];
    out.push({
      ...base,
      id: `activity-${idx + 1}`,
      affectedItemId: `${base.affectedItemId}-${idx + 1}`,
    });
  }
  return out;
}
