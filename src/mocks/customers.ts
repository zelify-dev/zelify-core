"use client";

export type CustomerState = "Active" | "Inactive" | "In Arrears" | "Blacklisted" | "Pending Approval";

export type CustomerAccount = {
  id: string;
  name: string;
  type: "Loan" | "Deposit" | "Current Account" | "Savings";
  state: "Active" | "In Arrears" | "Closed" | "Matured";
  balance: number;
  currency: string;
};

export type ActivityEvent = {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  category: "Operation" | "Compliance" | "Product" | "Identity";
};

export type Customer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  state: CustomerState;
  branch: string;
  creditOfficer: string;
  totalBalance: number;
  lastModified: string;
  createdDate: string;
  approvedDate?: string;
  closedDate?: string;
  clientType: "Individual" | "Corporate";
  assignedCentre: string;
  personalInfo: {
    gender: string;
    birthDate: string;
    preferredLanguage: string;
    address: string;
  };
  accounts: CustomerAccount[];
  activity: ActivityEvent[];
};

export const mockCustomers: Customer[] = [
  {
    id: "CL-882914",
    fullName: "Jannik Sinner",
    email: "j.sinner@tennis.it",
    phone: "+39 012 345 6789",
    state: "Active",
    branch: "Milan Main",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 45000.0,
    lastModified: "2026-04-18 15:30",
    createdDate: "2024-01-10",
    approvedDate: "2024-01-12",
    clientType: "Individual",
    assignedCentre: "Northern Italy Cluster",
    personalInfo: {
      gender: "Male",
      birthDate: "2001-08-16",
      preferredLanguage: "Italian",
      address: "Via della Vittoria 10, San Candido, Italy",
    },
    accounts: [
      {
        id: "ACC-KTCS101",
        name: "Personal Loan - Home Improvement",
        type: "Loan",
        state: "In Arrears",
        balance: 28500.0,
        currency: "EUR",
      },
      {
        id: "ACC-YJXQ048",
        name: "Business Expansion Loan",
        type: "Loan",
        state: "Active",
        balance: 16500.0,
        currency: "EUR",
      },
    ],
    activity: [
      {
        id: "EV-001",
        type: "Status Change",
        description: "Product ACC-KTCS101 is now in arrears",
        timestamp: "2026-04-18 10:15",
        category: "Product",
      },
      {
        id: "EV-002",
        type: "Profile Edited",
        description: "Updated contact phone number",
        timestamp: "2026-04-17 14:22",
        category: "Identity",
      },
      {
        id: "EV-003",
        type: "Operation",
        description: "Successful login from Milan, Italy",
        timestamp: "2026-04-17 09:10",
        category: "Operation",
      },
      {
        id: "EV-004",
        type: "Product Event",
        description: "Loan disbursement of €16,500.00 for ACC-YJXQ048",
        timestamp: "2026-04-10 11:00",
        category: "Product",
      },
    ],
  },
  {
    id: "CL-220411",
    fullName: "Andrea Molina",
    email: "a.molina@zelify.com",
    phone: "+34 600 112 233",
    state: "Active",
    branch: "Madrid Central",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 12450.5,
    lastModified: "2026-04-18 12:45",
    createdDate: "2023-11-05",
    clientType: "Individual",
    assignedCentre: "Spain HQ",
    personalInfo: {
      gender: "Female",
      birthDate: "1992-05-20",
      preferredLanguage: "Spanish",
      address: "Calle de Alcalá 45, Madrid, Spain",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-998123",
    fullName: "Global Tech Solutions",
    email: "ops@globaltech.com",
    phone: "+1 555 900 8877",
    state: "Pending Approval",
    branch: "Miami Tech Park",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 0.0,
    lastModified: "2026-04-19 09:00",
    createdDate: "2026-04-15",
    clientType: "Corporate",
    assignedCentre: "USA Hub",
    personalInfo: {
      gender: "N/A",
      birthDate: "2015-08-10",
      preferredLanguage: "English",
      address: "100 Silicon Way, Miami FL, USA",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-554102",
    fullName: "Carlos Slim Domit",
    email: "c.slim@mexico.mx",
    phone: "+52 55 1234 5678",
    state: "Active",
    branch: "Mexico City North",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 890400.0,
    lastModified: "2026-04-18 18:20",
    createdDate: "2022-03-20",
    clientType: "Individual",
    assignedCentre: "LATAM Hub",
    personalInfo: {
      gender: "Male",
      birthDate: "1967-02-28",
      preferredLanguage: "Spanish",
      address: "Paseo de la Reforma 200, CDMX, Mexico",
    },
    accounts: [
      { id: "ACC-MEX001", name: "Executive Savings", type: "Savings", state: "Active", balance: 890400.0, currency: "USD" }
    ],
    activity: [],
  },
  {
    id: "CL-332198",
    fullName: "Sofia Petrov",
    email: "s.petrov@gmail.com",
    phone: "+7 495 777 0011",
    state: "Blacklisted",
    branch: "Moscow West",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 120.5,
    lastModified: "2026-04-17 09:45",
    createdDate: "2023-01-15",
    clientType: "Individual",
    assignedCentre: "Eastern Europe",
    personalInfo: {
      gender: "Female",
      birthDate: "1988-11-12",
      preferredLanguage: "Russian",
      address: "Tverskaya St 5, Moscow, Russia",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-778811",
    fullName: "Blue Ocean Logistics",
    email: "logistics@blueocean.com",
    phone: "+44 20 7946 0123",
    state: "In Arrears",
    branch: "London Docklands",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 1450000.0,
    lastModified: "2026-04-18 22:15",
    createdDate: "2023-05-10",
    clientType: "Corporate",
    assignedCentre: "UK Operations",
    personalInfo: {
      gender: "N/A",
      birthDate: "2008-01-01",
      preferredLanguage: "English",
      address: "1 Maritime Plaza, London, UK",
    },
    accounts: [
      { id: "ACC-UK-L001", name: "Corporate Credit Line", type: "Loan", state: "In Arrears", balance: 1450000.0, currency: "GBP" }
    ],
    activity: [],
  },
  {
    id: "CL-112233",
    fullName: "Elena Gilbert",
    email: "e.gilbert@mysticfalls.us",
    phone: "+1 434 555 0101",
    state: "Inactive",
    branch: "Virginia HQ",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 5400.0,
    lastModified: "2026-03-01 10:00",
    createdDate: "2022-09-12",
    clientType: "Individual",
    assignedCentre: "USA Hub",
    personalInfo: {
      gender: "Female",
      birthDate: "1992-06-22",
      preferredLanguage: "English",
      address: "2104 Maple St, Mystic Falls, VA",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-440055",
    fullName: "Igor Stravinsky",
    email: "i.strav@music.fr",
    phone: "+33 1 42 68 53 00",
    state: "Active",
    branch: "Paris Rive Gauche",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 125000.0,
    lastModified: "2026-04-18 11:30",
    createdDate: "2024-02-14",
    clientType: "Individual",
    assignedCentre: "Western Europe",
    personalInfo: {
      gender: "Male",
      birthDate: "1882-06-17",
      preferredLanguage: "French",
      address: "Rue de la Harpe 12, Paris, France",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-667788",
    fullName: "Nomad Coffee Co.",
    email: "hello@nomadcoffee.es",
    phone: "+34 93 123 45 67",
    state: "Active",
    branch: "Barcelona Eixample",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 24500.25,
    lastModified: "2026-04-19T08:20",
    createdDate: "2024-03-01",
    clientType: "Corporate",
    assignedCentre: "Spain HQ",
    personalInfo: {
      gender: "N/A",
      birthDate: "2020-01-15",
      preferredLanguage: "Spanish",
      address: "Carrer de Balmes 50, Barcelona, Spain",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-990011",
    fullName: "Marcus Aurelius",
    email: "m.aurelius@rome.it",
    phone: "+39 06 1234567",
    state: "Active",
    branch: "Rome Imperial",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 2500000.0,
    lastModified: "2026-04-15 17:00",
    createdDate: "2020-01-01",
    clientType: "Individual",
    assignedCentre: "Northern Italy Cluster",
    personalInfo: {
      gender: "Male",
      birthDate: "0121-04-26",
      preferredLanguage: "Latin",
      address: "Palatine Hill, Rome, Italy",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-123456",
    fullName: "Sarah Connor",
    email: "s.connor@resistance.net",
    phone: "+1 213 555 9090",
    state: "Active",
    branch: "Los Angeles South",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 7500.0,
    lastModified: "2026-04-18 19:15",
    createdDate: "2025-05-12",
    clientType: "Individual",
    assignedCentre: "USA Hub",
    personalInfo: {
      gender: "Female",
      birthDate: "1965-11-10",
      preferredLanguage: "English",
      address: "Encino, CA, USA",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-654321",
    fullName: "Nakamoto Mining Corp",
    email: "blocks@nakamoto.jp",
    phone: "+81 3 1234 5678",
    state: "Active",
    branch: "Tokyo Finance District",
    creditOfficer: "Valerio Ferrari",
    totalBalance: 12500000.0,
    lastModified: "2026-04-19 14:00",
    createdDate: "2024-01-01",
    clientType: "Corporate",
    assignedCentre: "Asia Pacific",
    personalInfo: {
      gender: "N/A",
      birthDate: "2009-01-03",
      preferredLanguage: "Japanese",
      address: "1-1-1 Chiyoda, Tokyo, Japan",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-101010",
    fullName: "Arthur Dent",
    email: "a.dent@earth.co.uk",
    phone: "+44 20 8888 8888",
    state: "Active",
    branch: "London West",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 42.0,
    lastModified: "2026-04-10 12:00",
    createdDate: "2024-05-15",
    clientType: "Individual",
    assignedCentre: "UK Operations",
    personalInfo: {
      gender: "Male",
      birthDate: "1978-01-01",
      preferredLanguage: "English",
      address: "Prebendal Avenue, Aylesbury, UK",
    },
    accounts: [],
    activity: [],
  },
  {
    id: "CL-202020",
    fullName: "Wonderland Tea Co.",
    email: "hatter@tea.me",
    phone: "+4 000 000 000",
    state: "Pending Approval",
    branch: "Forest Branch",
    creditOfficer: "Sarah Jenkins",
    totalBalance: 0.0,
    lastModified: "2026-04-19 04:00",
    createdDate: "2026-04-18",
    clientType: "Corporate",
    assignedCentre: "Special Entities",
    personalInfo: {
      gender: "N/A",
      birthDate: "1865-11-26",
      preferredLanguage: "Gibberish",
      address: "Under the Mushroom, Woods, Wonderland",
    },
    accounts: [],
    activity: [],
  },
];

