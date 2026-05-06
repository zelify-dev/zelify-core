import type { SystemActivityRow } from "../types/system-activity.types";

/** Total según referencia Figma (paginación “1 – 50 of 865”). */
export const SYSTEM_ACTIVITIES_TOTAL = 865;

const SAMPLE_ROWS: Omit<SystemActivityRow, "id" | "affectedItemId">[] = [
  {
    creationDate: "30-07-2025",
    userKey: "camilaRojas",
    actionKey: "depositAccountEdited",
    itemKey: "savingsAccountUpdate",
    itemIdPrefix: "DEP-OPS",
    clientKey: "mariaFernandaParedes",
  },
  {
    creationDate: "29-07-2025",
    userKey: "joseHerrera",
    actionKey: "userLoggedIn",
    itemKey: "cashPositionReview",
    itemIdPrefix: "SEC-AUD",
    clientKey: "luisCardenas",
  },
  {
    creationDate: "28-07-2025",
    userKey: "andreaMolina",
    actionKey: "taskCompleted",
    itemKey: "monthlyReconciliation",
    itemIdPrefix: "REC-USD",
    clientKey: "andeanTreasury",
  },
  {
    creationDate: "27-07-2025",
    userKey: "juanCarlos",
    actionKey: "loanTermsUpdated",
    itemKey: "workingCapitalLoan",
    itemIdPrefix: "LN-WC",
    clientKey: "transportePacifico",
  },
  {
    creationDate: "26-07-2025",
    userKey: "system",
    actionKey: "scheduledJobCompleted",
    itemKey: "eodPosting",
    itemIdPrefix: "EOD-20250726",
    clientKey: "none",
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
      affectedItemId: `${base.itemIdPrefix}-${idx + 1}`,
    });
  }
  return out;
}
