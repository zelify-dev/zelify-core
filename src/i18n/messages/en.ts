/**
 * Default UI copy (English). Spanish must mirror this shape in `es.ts`.
 * Use `t("segment.other.leaf")` — no branching on locale in feature code.
 */
export const en = {
  meta: {
    title: "Zelify Core",
    description: "SaaS core banking platform built with Next.js and Tamagui.",
  },
  common: {
    language: "Language",
    english: "English",
    spanish: "Spanish",
  },
  topbar: {
    create: "Create",
    view: "View",
    createMenu: {
      client: "Client",
      organization: "Organization",
      group: "Group",
      account: "Account",
      user: "User",
      communication: "Communication",
    },
    viewMenu: {
      clients: "Clients",
      organizations: "Organizations",
      accounts: "Accounts",
      transactions: "Transactions",
      activities: "Activities",
      users: "Users",
      communications: "Communications",
      reports: "Reports",
    },
    search: {
      groupClients: "Clients",
      groupAccounts: "Accounts",
      groupTransactions: "Transactions",
      groupUsers: "Users",
      sampleOrg: "Andean Treasury Group",
      sampleAccount: "002-4481 Operating Account",
      sampleTx: "TX-2026-04-18-88214",
      sampleUser: "Andrea Molina",
    },
    notifications: "Notifications",
    searchPlaceholder: "Search clients, accounts, transactions",
    brandAlt: "Zelify",
    navPrimary: "Primary",
    navAdministration: "Administration",
    profileMenu: {
      ariaLabel: "User menu",
      userSettings: "User settings",
      signOut: "Sign out",
      signingOut: "Signing out…",
    },
  },
  org: {
    allOrganizations: "ALL ORGANIZATIONS",
  },
  nav: {
    top: {
      dashboard: "Dashboard",
      clients: "Clients",
      groups: "Groups",
      loans: "Loans",
      deposits: "Deposits",
      loanTransactions: "Loan Transactions",
      depositTransactions: "Deposit Transactions",
      activities: "Activities",
      branches: "Branches",
      products: "Products",
      reporting: "Reporting",
      accounting: "Accounting",
      administration: "Administration",
    },
    admin: {
      generalSetup: "General Setup",
      financialSetup: "Financial Setup",
      organization: "Organization",
      access: "Access",
      products: "Products",
      fields: "Fields",
      views: "Views",
      forms: "Forms",
      sms: "SMS",
      email: "Email",
      webhooks: "Webhooks",
      eventsStreaming: "Events Streaming",
      templates: "Templates",
      apps: "Apps",
      tasks: "Tasks",
      data: "Data",
    },
    dropdowns: {
      clients: {
        f1Pilot: "F1 Pilot",
        tennisPlayer: "Tennis Player",
        activeClients: "Active clients",
        inactive: "Inactive",
        pendingApproval: "Pending Approval",
        setAside: "Set Aside",
        blacklist: "Blacklist",
        allClients: "All Clients",
      },
      groups: {
        activeLoans: "Active Loans",
        activeDeposits: "Active Deposits",
        noActiveAccounts: "No active accounts",
        noMembers: "No members",
        allGroups: "All Groups",
      },
      loans: {
        activeLoan: "Active Loan",
        pendingApproval: "Pending Approval",
        pendingDisbursement: "Pending disbursement",
        overdue: "Overdue",
        close: "Close",
        renegotiated: "Renegotiated",
        cancelled: "Cancelled",
        allLoanAccounts: "All Loan Accounts",
      },
      activities: {
        allActivities: "All Activities",
      },
      reporting: {
        indicators: "Indicators",
        portfolio: "Portfolio",
        organization: "Organization",
        earnings: "Earnings",
        cashflow: "Cashflow",
        outreach: "Outreach",
        risk: "Risk",
      },
      accounting: {
        balanceSheet: "Balance Sheet",
        profitLoss: "Profit & Loss",
        trialBalance: "Trial Balance",
        journalEntries: "Journal Entries",
        interestAccrualBreakdown: "Interest Accrual Breakdown",
        chartOfAccounts: "Chart of Accounts",
        closures: "Closures",
      },
    },
  },
} as const;

type DeepStringify<T> = T extends string
  ? string
  : T extends object
    ? { [K in keyof T]: DeepStringify<T[K]> }
    : T;

/** Misma forma que `en`, con hojas como `string` para el catálogo en español u otros idiomas. */
export type Messages = DeepStringify<typeof en>;
