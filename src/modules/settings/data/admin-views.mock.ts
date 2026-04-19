import type { AdminViewParentMenu, AdminViewRow } from "../types/admin-view.types";

export const PARENT_MENU_OPTIONS: { value: AdminViewParentMenu; label: string }[] = [
  { value: "clients", label: "Clients" },
  { value: "groups", label: "Groups" },
  { value: "loans", label: "Loans" },
  { value: "deposits", label: "Deposits" },
  { value: "loan-transactions", label: "Loan Transactions" },
  { value: "deposit-transactions", label: "Deposit Transactions" },
  { value: "activities", label: "Activities" },
  { value: "branches", label: "Branches" },
];

export const mockAdminViews: AdminViewRow[] = [
  {
    id: "v1",
    parentMenu: "clients",
    name: "F1 Pilot",
    isFavorite: true,
    filter: "Where Client Type is F1 Pilot",
    owner: "you",
  },
  {
    id: "v2",
    parentMenu: "clients",
    name: "Tennis Player",
    isFavorite: true,
    filter: "Where Client Type is Tennis Player",
    owner: "mambu",
  },
  {
    id: "v3",
    parentMenu: "clients",
    name: "Active clients",
    isFavorite: true,
    filter: "Where Client State is Active",
    owner: "you",
  },
  {
    id: "v4",
    parentMenu: "clients",
    name: "Inactive",
    isFavorite: false,
    filter: "Where Client State is Inactive",
    owner: "mambu",
  },
  {
    id: "v5",
    parentMenu: "clients",
    name: "Pending Approval",
    isFavorite: false,
    filter: "Where Client State is Pending Approval",
    owner: "you",
  },
  {
    id: "v6",
    parentMenu: "clients",
    name: "Set Aside",
    isFavorite: false,
    filter: "Where Client State is Set Aside",
    owner: "mambu",
  },
  {
    id: "v7",
    parentMenu: "clients",
    name: "Blacklist",
    isFavorite: false,
    filter: "Where Client State is Blacklisted",
    owner: "mambu",
  },
  {
    id: "v8",
    parentMenu: "loans",
    name: "High exposure",
    isFavorite: true,
    filter: "Where Principal Outstanding > 100000",
    owner: "you",
  },
];
