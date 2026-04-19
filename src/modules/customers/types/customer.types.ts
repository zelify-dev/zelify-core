export enum ClientState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLACKLISTED = 'BLACKLISTED',
  PENDING = 'PENDING',
}

export interface Customer {
  id: string;
  fullName: string;
  state: ClientState;
  creditOfficer: string;
  totalBalance: number;
  lastModified: string;
  birthDate: string;
}

export interface CustomerFilters {
  branch: string;
  birthDateAfter?: string;
}
