export type AdminViewParentMenu =
  | "clients"
  | "groups"
  | "loans"
  | "deposits"
  | "loan-transactions"
  | "deposit-transactions"
  | "activities"
  | "branches";

export type AdminViewRow = {
  id: string;
  parentMenu: AdminViewParentMenu;
  name: string;
  isFavorite: boolean;
  filter: string;
  owner: "you" | "mambu";
};
