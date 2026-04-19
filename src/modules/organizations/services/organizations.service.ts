import { OrganizationUnit, UnitState } from '../types/organization.types';

const MOCK_BRANCHES: OrganizationUnit[] = [
  {
    id: 'HQ',
    name: 'Headquarters',
    state: UnitState.ACTIVE,
    address: 'Av. Principal 123, Madrid',
    created: '01-01-2024',
    lastModified: '18-04-2026',
  },
  {
    id: 'BCN01',
    name: 'Barcelona Branch',
    state: UnitState.ACTIVE,
    address: 'Carrer de Mallorca 45, Barcelona',
    created: '15-02-2024',
    lastModified: '17-04-2026',
  },
  {
    id: 'SVD02',
    name: 'Sevilla Digital',
    state: UnitState.DEACTIVATED,
    address: 'Calle Sierpes 10, Sevilla',
    created: '10-03-2024',
    lastModified: '05-04-2026',
  },
];

const MOCK_CENTRES: OrganizationUnit[] = [
  {
    id: 'CALL-01',
    name: 'Customer Support Centre',
    state: UnitState.ACTIVE,
    address: 'Remote / Hybrid',
    created: '05-01-2024',
    lastModified: '18-04-2026',
  },
  {
    id: 'DATA-01',
    name: 'Data Processing Hub',
    state: UnitState.ACTIVE,
    address: 'Tech Park, Valencia',
    created: '20-05-2024',
    lastModified: '15-04-2026',
  },
];

export const organizationsService = {
  getBranches: async (): Promise<OrganizationUnit[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_BRANCHES;
  },
  getCentres: async (): Promise<OrganizationUnit[]> => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_CENTRES;
  },
};
