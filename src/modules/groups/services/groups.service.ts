import { Group, GroupState } from '../types/group.types';

const MOCK_GROUPS: Group[] = [
  {
    id: "GRP-001",
    name: "Tech Solutions Corp",
    state: GroupState.ACTIVE,
    branch: "Main Branch",
    membersCount: 15,
    hasActiveLoans: true,
    hasActiveDeposits: true,
    lastModified: "2026-04-10",
  },
  {
    id: "GRP-002",
    name: "Cooperativa Agrícola Norte",
    state: GroupState.ACTIVE,
    branch: "Northern Hub",
    membersCount: 45,
    hasActiveLoans: true,
    hasActiveDeposits: false,
    lastModified: "2026-04-12",
  },
  {
    id: "GRP-003",
    name: "Startup Incubator Ltd",
    state: GroupState.PENDING_APPROVAL,
    branch: "Central Hub",
    membersCount: 8,
    hasActiveLoans: false,
    hasActiveDeposits: true,
    lastModified: "2026-04-14",
  },
  {
    id: "GRP-004",
    name: "Independent Retailers Association",
    state: GroupState.INACTIVE,
    branch: "Main Branch",
    membersCount: 22,
    hasActiveLoans: false,
    hasActiveDeposits: false,
    lastModified: "2026-04-15",
  },
  {
    id: "GRP-005",
    name: "Ghost Venture Capital",
    state: GroupState.BLACKLISTED,
    branch: "Main Branch",
    membersCount: 3,
    hasActiveLoans: false,
    hasActiveDeposits: false,
    lastModified: "2026-04-18",
  },
  {
    id: "GRP-006",
    name: "Empty shell Org",
    state: GroupState.ACTIVE,
    branch: "Main Branch",
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
