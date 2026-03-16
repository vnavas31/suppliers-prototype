import type {
  ReviewItem,
  Opportunity,
  MinorContract,
  ForecastContract,
  SavedFilter,
  BenchPeriod,
  RankedEntity,
  DesertedTender,
  AnnualPurchasingPlan,
  DynamicPurchasingSystem,
} from "../types/types";

export type TenderBenchmarkProfile = {
  successRate: number;
  successRateLabel: string;
  avgDiscount: number;
  avgDiscountLabel: string;
  contractsWithBuyer: number;
};

export type TenderPricingConfig = {
  idealDiscountDelta: number;
};

export type TenderComplianceDefaults = {
  documentsCompliantCount: number;
  admissionCompliantCount: number;
};

export type TenderScenarioMock = {
  myBenchmark: TenderBenchmarkProfile;
  pricing: TenderPricingConfig;
  complianceDefaults: TenderComplianceDefaults;
};

export const reviewItems: ReviewItem[] = [
  {
    title: "Closure and quay enablement works at Puerto de Granadilla",
    fit: 92,
    value: "€39.71M",
    deadline: "17 Apr 2026",
  },
  {
    title: "PFEA 2025 works materials and support supplies",
    fit: 88,
    value: "€308.5K",
    deadline: "26 Jan 2026",
  },
  {
    title: "Citizen self-service kiosks with purchase option",
    fit: 84,
    value: "€60K",
    deadline: "15 Jun 2022",
  },
];

export const opportunities: Opportunity[] = [
  {
    id: "2026-001778419",
    title: "Closure and quay enablement works at Puerto de Granadilla",
    buyer: "Port Authority of Santa Cruz de Tenerife",
    value: "€39.71M",
    location: "Santa Cruz de Tenerife",
    deadline: "17 Apr 2026",
    score: 92,
    procedure: "Open procedure",
    isSeen: false,
    isDismissed: false,
    summary:
      "Execution of the closure and operational enablement of the quay at Puerto de Granadilla, including maritime works, caissons, submerged concrete closures and pavement enabling.",
  },
  {
    id: "2025-001484637",
    title: "PFEA 2025 works materials and support supplies",
    buyer: "Montilla City Council",
    value: "€308.5K",
    location: "Montilla",
    deadline: "26 Jan 2026",
    score: 88,
    procedure: "Open procedure",
    lots: 11,
    isSeen: true,
    isDismissed: false,
    summary:
      "Mixed contract split into eleven lots for demolitions, earth movement and supply materials required for PFEA 2025 works, with price-only award and fast delivery requirements.",
  },
  {
    id: "2022-808905",
    title: "Rental with purchase option of three citizen self-service kiosks",
    buyer: "Algemesí City Council",
    value: "€60K",
    location: "Algemesí",
    deadline: "15 Jun 2022",
    score: 84,
    procedure: "Open procedure",
    isSeen: false,
    isDismissed: false,
    summary:
      "Supply contract for three citizen self-service kiosks under a rental model with purchase option, including technical memory, demo validation and mixed price / option / judgement criteria.",
  },
];

export const minorContracts: MinorContract[] = [
  {
    id: "2026-001786387",
    title:
      "Minor contract for supply and installation of climate control at Yacimiento de La Clínica",
    buyer: "Calahorra City Council",
    estimatedValue: "€4.818",
    location: "Calahorra",
    publicationDate: "13 Mar 2026",
    category: "HVAC equipment",
    score: 79,
    isSeen: false,
    isDismissed: false,
    summary:
      "Minor contract under PRTR / NextGenerationEU for supply and installation of climate control in the immersive space at Yacimiento de La Clínica, with RITE installer qualification and mandatory PRTR annexes.",
  },
];

export const forecastContracts: ForecastContract[] = [
  {
    id: "CONTRACT-001",
    title: "Metro Maintenance Contract for Rolling Stock and Depot Systems",
    buyer: "Madrid Metro",
    value: "€12M",
    renewal: "Expected renewal in 4 months",
    probability: 78,
    score: 85,
    location: "Madrid",
    contractEnd: "31 Jul 2026",
    category: "Transport maintenance",
    lots: 4,
    isSeen: false,
    isDismissed: false,
    summary:
      "Current contract nearing expiry for preventive and corrective maintenance across rolling stock, depots and support systems.",
  },
  {
    id: "CONTRACT-002",
    title: "City IT Services for Workplace Support and Network Operations",
    buyer: "Lisbon Municipality",
    value: "€8M",
    renewal: "Expected renewal in 6 months",
    probability: 65,
    score: 81,
    location: "Lisbon",
    contractEnd: "30 Sep 2026",
    category: "IT managed services",
    lots: 2,
    isSeen: true,
    isDismissed: false,
    summary:
      "Existing managed services agreement for helpdesk, endpoint support, field services and network operations covering multiple municipal sites.",
  },
];

export const desertedTenders: DesertedTender[] = [
  {
    id: "DES-2024-118",
    title: "Supply of Electric Utility Vehicles for Urban Cleaning Teams",
    buyer: "Ayuntamiento de Valladolid",
    referenceValue: "€680K",
    location: "Valladolid",
    lastDeadline: "12 Feb 2026",
    procedure: "Open procedure",
    reasonHint: "Budget / spec misalignment",
    lots: 2,
    score: 76,
    isSeen: false,
    isDismissed: false,
    summary:
      "Previous call received no admissible bids after technical requirements and delivery times limited supplier participation.",
  },
  {
    id: "DES-2024-221",
    title: "Managed Wi-Fi Service for Regional Administrative Buildings",
    buyer: "Gobierno de Navarra",
    referenceValue: "€1.15M",
    location: "Pamplona",
    lastDeadline: "05 Mar 2026",
    procedure: "Open procedure",
    reasonHint: "Low bidder interest",
    score: 81,
    isSeen: true,
    isDismissed: false,
    summary:
      "Tender declared deserted due to lack of valid proposals in a procurement aimed at renewing connectivity and monitoring across offices.",
  },
];

export const annualPurchasingPlans: AnnualPurchasingPlan[] = [
  {
    id: "APP-2026-014",
    title: "Digital Workplace Equipment Refresh",
    buyer: "Diputación de Barcelona",
    estimatedValue: "€3.8M",
    location: "Barcelona",
    expectedPublication: "Q2 2026",
    category: "IT hardware",
    score: 87,
    isSeen: false,
    isDismissed: false,
    summary:
      "Planned procurement covering laptops, monitors, accessories and deployment services for administrative staff and public service units.",
  },
  {
    id: "APP-2026-031",
    title: "Road Surface Rehabilitation and Preventive Maintenance Programme",
    buyer: "Ayuntamiento de Sevilla",
    estimatedValue: "€11.4M",
    location: "Seville",
    expectedPublication: "Q3 2026",
    category: "Construction works",
    score: 82,
    isSeen: true,
    isDismissed: false,
    summary:
      "Yearly purchasing plan grouping resurfacing, signalling and preventive maintenance interventions across priority urban corridors.",
  },
];

export const dynamicPurchasingSystems: DynamicPurchasingSystem[] = [
  {
    id: "DPS-2025-009",
    title: "Dynamic Purchasing System for Office Supplies and Small Equipment",
    buyer: "Junta de Castilla y León",
    estimatedValue: "€6.5M",
    location: "Valladolid",
    category: "Office supplies",
    expiry: "31 Dec 2028",
    lots: 4,
    score: 77,
    isSeen: false,
    isDismissed: false,
    summary:
      "Open DPS enabling continuous admission of suppliers for recurring office material, small devices and ancillary workplace items.",
  },
  {
    id: "DPS-2025-017",
    title: "Dynamic Purchasing System for IT Peripherals and End-User Devices",
    buyer: "Generalitat Valenciana",
    estimatedValue: "€14.2M",
    location: "Valencia",
    category: "IT hardware",
    expiry: "30 Sep 2029",
    lots: 7,
    score: 91,
    isSeen: true,
    isDismissed: false,
    summary:
      "Multi-lot DPS for ongoing procurement of laptops, screens, docking stations and peripherals with mini-competitions per need.",
  },
];

export const savedFilters: SavedFilter[] = [
  {
    id: "f1",
    name: "Spain · Real samples",
    description: "Sample tenders aligned with uploaded XMLs",
    isDefault: true,
  },
  {
    id: "f2",
    name: "Ports and infrastructure",
    description: "High-value infrastructure and maritime works",
  },
  {
    id: "f3",
    name: "Local authorities · materials",
    description: "Local authority tenders with supplies and lots",
  },
  {
    id: "f4",
    name: "Minor contracts · facilities",
    description: "Minor contracts related to equipment and installations",
  },
];

export const benchmarkPeriods: BenchPeriod[] = [
  { label: "3M", awards: "28", volume: "€12.4M", tone: "strong" },
  { label: "6M", awards: "51", volume: "€21.7M", tone: "medium" },
  { label: "12M", awards: "103", volume: "€44.9M", tone: "light" },
];

export const rankedBuyers: RankedEntity[] = [
  {
    name: "Port Authority of Santa Cruz de Tenerife",
    awards: "12",
    volume: "€58M",
    width: "92%",
  },
  {
    name: "Montilla City Council",
    awards: "34",
    volume: "€2.6M",
    width: "64%",
  },
  {
    name: "Algemesí City Council",
    awards: "9",
    volume: "€1.1M",
    width: "38%",
  },
];

export const rankedSuppliers: RankedEntity[] = [
  {
    name: "Acciona Construcción S.A.",
    awards: "18",
    volume: "€74M",
    width: "90%",
  },
  {
    name: "Dragados S.A.",
    awards: "14",
    volume: "€61M",
    width: "81%",
  },
  {
    name: "Smart Kiosk Iberia S.L.",
    awards: "4",
    volume: "€320K",
    width: "32%",
  },
];

export const tenderScenariosById: Record<string, TenderScenarioMock> = {
  "2026-001778419": {
    myBenchmark: {
      successRate: 33,
      successRateLabel: "33.0%",
      avgDiscount: 8.4,
      avgDiscountLabel: "8.4%",
      contractsWithBuyer: 2,
    },
    pricing: {
      idealDiscountDelta: 0.3,
    },
    complianceDefaults: {
      documentsCompliantCount: 2,
      admissionCompliantCount: 3,
    },
  },

  "2025-001484637": {
    myBenchmark: {
      successRate: 41,
      successRateLabel: "41.0%",
      avgDiscount: 6.2,
      avgDiscountLabel: "6.2%",
      contractsWithBuyer: 5,
    },
    pricing: {
      idealDiscountDelta: 0.4,
    },
    complianceDefaults: {
      documentsCompliantCount: 2,
      admissionCompliantCount: 3,
    },
  },

  "2022-808905": {
    myBenchmark: {
      successRate: 29,
      successRateLabel: "29.0%",
      avgDiscount: 4.8,
      avgDiscountLabel: "4.8%",
      contractsWithBuyer: 1,
    },
    pricing: {
      idealDiscountDelta: 0.2,
    },
    complianceDefaults: {
      documentsCompliantCount: 2,
      admissionCompliantCount: 3,
    },
  },

  "2026-001786387": {
    myBenchmark: {
      successRate: 36,
      successRateLabel: "36.0%",
      avgDiscount: 5.5,
      avgDiscountLabel: "5.5%",
      contractsWithBuyer: 1,
    },
    pricing: {
      idealDiscountDelta: 0.3,
    },
    complianceDefaults: {
      documentsCompliantCount: 2,
      admissionCompliantCount: 3,
    },
  },
};

export const defaultTenderScenario: TenderScenarioMock = {
  myBenchmark: {
    successRate: 33,
    successRateLabel: "33.0%",
    avgDiscount: 8.4,
    avgDiscountLabel: "8.4%",
    contractsWithBuyer: 2,
  },
  pricing: {
    idealDiscountDelta: 0.3,
  },
  complianceDefaults: {
    documentsCompliantCount: 2,
    admissionCompliantCount: 3,
  },
};