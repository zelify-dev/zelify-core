export type AdminWebhooksNotificationRow = {
  id: string;
  name: string;
  eventTitle: string;
  eventDescription: string;
  state: string;
  status: string;
  options: string;
};

export const mockAdminWebhooksNotifications: AdminWebhooksNotificationRow[] = [
  {
    id: "wh-1",
    name: "Loan disburse",
    eventTitle: "Loan Disbursement",
    eventDescription: "Your loan of {LOAN_AMOUNT} EUR has been disbursed.",
    state: "In Use",
    status: "Active",
    options: "Opt-Out",
  },
  {
    id: "wh-2",
    name: "Repayment",
    eventTitle: "Repayment",
    eventDescription: "A payment of {PAYMENT_AMOUNT} has been applied to [ACCOUNT_NAME].",
    state: "In Use",
    status: "Active",
    options: "Opt-Out",
  },
  {
    id: "wh-3",
    name: "Deposit creation",
    eventTitle: "Deposit Created",
    eventDescription: "A new deposit account was created for [CLIENT_NAME].",
    state: "Not In Use",
    status: "Active",
    options: "Opt-Out",
  },
];
