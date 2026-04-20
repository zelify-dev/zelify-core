import { Group, GroupState } from '../types/group.types';

const MOCK_GROUPS: Group[] = [
  {
    id: "GRP-001",
    name: "Tech Solutions Corp",
    assignedOfficer: "Laura Gomez",
    createdAt: "2026-01-10",
    state: GroupState.ACTIVE,
    membersCount: 15,
    hasActiveLoans: true,
    hasActiveDeposits: true,
    lastModified: "2026-04-10",
  },
  {
    id: "GRP-002",
    name: "Cooperativa Agrícola Norte",
    assignedOfficer: "Miguel Ortega",
    createdAt: "2026-01-25",
    state: GroupState.ACTIVE,
    membersCount: 45,
    hasActiveLoans: true,
    hasActiveDeposits: false,
    lastModified: "2026-04-12",
  },
  {
    id: "GRP-003",
    name: "Startup Incubator Ltd",
    assignedOfficer: "Ana Prieto",
    createdAt: "2026-02-12",
    state: GroupState.PENDING_APPROVAL,
    membersCount: 8,
    hasActiveLoans: false,
    hasActiveDeposits: true,
    lastModified: "2026-04-14",
  },
  {
    id: "GRP-004",
    name: "Independent Retailers Association",
    assignedOfficer: "Laura Gomez",
    createdAt: "2026-02-18",
    state: GroupState.INACTIVE,
    membersCount: 22,
    hasActiveLoans: false,
    hasActiveDeposits: false,
    lastModified: "2026-04-15",
  },
  {
    id: "GRP-005",
    name: "Ghost Venture Capital",
    assignedOfficer: "Compliance Team",
    createdAt: "2026-03-03",
    state: GroupState.BLACKLISTED,
    membersCount: 3,
    hasActiveLoans: false,
    hasActiveDeposits: false,
    lastModified: "2026-04-18",
  },
  {
    id: "GRP-006",
    name: "Empty shell Org",
    assignedOfficer: "Operations Team",
    createdAt: "2026-03-14",
    state: GroupState.ACTIVE,
    membersCount: 0,
    hasActiveLoans: false,
    hasActiveDeposits: false,
    lastModified: "2026-04-19",
  }
];

export const groupsService = {
  getGroups: async (): Promise<Group[]> => {
    // Simulate network delay
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_GROUPS), 500);
    });
  },
};
