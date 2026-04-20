export enum GroupState {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING_APPROVAL = "PENDING_APPROVAL",
  BLACKLISTED = "BLACKLISTED",
}

export interface Group {
  id: string;
  name: string;
  assignedOfficer: string;
  createdAt: string;
  state: GroupState;
  membersCount: number;
  hasActiveLoans: boolean;
  hasActiveDeposits: boolean;
  lastModified: string;
}

export type GroupView = 
  | "all-groups" 
  | "active-loans" 
  | "active-deposits" 
  | "sin-cuentas-activas" 
  | "sin-miembros";
