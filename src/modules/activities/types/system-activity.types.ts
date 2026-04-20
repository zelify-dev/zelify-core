export type SystemActivityUserKey = "valerioFerrari" | "andreaMolina" | "juanCarlos" | "system";

export type SystemActivityActionKey =
  | "depositAccountEdited"
  | "userLoggedIn"
  | "taskCompleted"
  | "loanTermsUpdated"
  | "scheduledJobCompleted";

export type SystemActivityItemKey =
  | "testFixDeposit"
  | "verifyBalance"
  | "monthlyReconciliation"
  | "operatingLoan"
  | "eodPosting";

export type SystemActivityClientKey = "rogerFederer" | "lewisHamilton" | "andeanTreasury" | "none";

export type SystemActivityRow = {
  id: string;
  creationDate: string;
  userKey: SystemActivityUserKey;
  actionKey: SystemActivityActionKey;
  itemKey: SystemActivityItemKey;
  itemIdPrefix: string;
  affectedItemId: string;
  clientKey: SystemActivityClientKey;
};
