import { ClientState, Customer } from '../types/customer.types';

const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '746222560',
    fullName: 'Andrea Molina',
    state: ClientState.ACTIVE,
    creditOfficer: '',
    totalBalance: -293.41,
    lastModified: '18-04-2026',
    birthDate: '15-05-1995',
  },
  {
    id: '552109332',
    fullName: 'Carlos Rodriguez',
    state: ClientState.ACTIVE,
    creditOfficer: '',
    totalBalance: 1250.00,
    lastModified: '17-04-2026',
    birthDate: '22-11-1988',
  },
  {
    id: '229871004',
    fullName: 'Elena Gomez',
    state: ClientState.INACTIVE,
    creditOfficer: '',
    totalBalance: 0.00,
    lastModified: '15-04-2026',
    birthDate: '03-02-1992',
  },
  {
    id: '110293847',
    fullName: 'Juan Perez',
    state: ClientState.BLACKLISTED,
    creditOfficer: '',
    totalBalance: -1500.00,
    lastModified: '10-04-2026',
    birthDate: '12-12-1985',
  },
  {
    id: '883746251',
    fullName: 'Maria Lopez',
    state: ClientState.ACTIVE,
    creditOfficer: '',
    totalBalance: 4560.75,
    lastModified: '18-04-2026',
    birthDate: '25-08-2002',
  },
];

export const customersService = {
  getCustomers: async (): Promise<Customer[]> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return MOCK_CUSTOMERS;
  },
};
