export type AdminEventStreamingRow = {
  id: string;
  name: string;
  eventTitle: string;
  eventMeta?: string;
  state: string;
  status: string;
  options: string;
};

export const mockAdminEventStreamingRows: AdminEventStreamingRow[] = [
  {
    id: "es-1",
    name: "Withdrawal",
    eventTitle: "Withdrawal",
    eventMeta: "[TRANSACTION_AMOUNT]",
    state: "In Use",
    status: "Active",
    options: "Opt-Out",
  },
  {
    id: "es-2",
    name: "Client creation",
    eventTitle: "Client Created",
    eventMeta: "Created [RECIPIENT_NAME]",
    state: "In Use",
    status: "Active",
    options: "Opt-Out",
  },
  {
    id: "es-3",
    name: "Loan disbursement",
    eventTitle: "Loan Disbursed",
    eventMeta: "[LOAN_ACCOUNT_ID]",
    state: "In Use",
    status: "Active",
    options: "Opt-In",
  },
  {
    id: "es-4",
    name: "Deposit posting",
    eventTitle: "Deposit Posted",
    eventMeta: "[TRANSACTION_AMOUNT]",
    state: "Not In Use",
    status: "Inactive",
    options: "Opt-Out",
  },
];
