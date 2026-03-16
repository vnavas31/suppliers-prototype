export type Page = "overview" | "discover" | "tender" | "simplifaer";

export type DiscoverTab =
  | "active"
  | "expiring"
  | "deserted"
  | "plans"
  | "dps"
  | "minor";

export type ViewMode = "list" | "cards";

export type TenderDetailTab =
  | "insights"
  | "lots"
  | "requiredDocuments"
  | "admissionCriteria"
  | "awardCriteria"
  | "tenderDocuments";

export type SavedFilter = {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
};

export type ReviewItem = {
  title: string;
  fit: number;
  value: string;
  deadline: string;
};

export type DiscoverInteraction = {
  isSeen?: boolean;
  isDismissed?: boolean;
};

export type Opportunity = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  value: string;
  location: string;
  deadline: string;
  score: number;
  procedure: string;
  summary: string;
  lots?: number;
};

export type ForecastContract = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  value: string;
  renewal: string;
  probability: number;
  score: number;
  location: string;
  contractEnd: string;
  category: string;
  summary: string;
  lots?: number;
};

export type DesertedTender = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  referenceValue: string;
  location: string;
  lastDeadline: string;
  procedure: string;
  reasonHint: string;
  summary: string;
  score: number;
  lots?: number;
};

export type AnnualPurchasingPlan = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  estimatedValue: string;
  location: string;
  expectedPublication: string;
  category: string;
  summary: string;
  score: number;
};

export type DynamicPurchasingSystem = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  estimatedValue: string;
  location: string;
  category: string;
  expiry: string;
  summary: string;
  score: number;
  lots?: number;
};

export type MinorContract = DiscoverInteraction & {
  id: string;
  title: string;
  buyer: string;
  estimatedValue: string;
  location: string;
  publicationDate: string;
  category: string;
  summary: string;
  score: number;
  lots?: number;
};

export type BenchPeriod = {
  label: string;
  awards: string;
  volume: string;
  tone: string;
};

export type RankedEntity = {
  name: string;
  awards: string;
  volume: string;
  width: string;
};

export type SimplifaerItemContext = {
  id: string;
  title: string;
  buyer: string;
  value: string;
  subtitle: string;
  badge: string;
  type: "tender" | "contract";
};

export type DrawerAction = {
  label: string;
  kind: "local" | "external" | "workspace";
};

export type TenderHeaderBadge = {
  label: string;
  tone?: "neutral" | "teal" | "purple" | "amber";
};

export type TenderTimelineItem = {
  label: string;
  value: string;
  tone?: "default" | "highlight";
};

export type TenderOverviewCard = {
  title: string;
  lines: Array<{
    label: string;
    value: string;
    tone?: "default" | "strong" | "teal";
  }>;
  topMeta?: string;
};

export type TenderDecisionSignal = {
  label: string;
  value: "Low" | "Medium" | "High";
};

export type TenderInsightAlert = {
  id: string;
  title: string;
  status: "missing" | "notMet" | "notDetected";
  hint?: string;
  sourceLabel: string;
};

export type TenderInsightMetric = {
  title: string;
  value: string;
  subtitle?: string;
};

export type TenderParticipant = {
  id: string;
  name: string;
  fiscalId: string;
  participations: number;
  awards: number;
  successRate: string;
  avgDiscount: string;
  contractsWithBuyer: number;
};

export type TenderLot = {
  id: string;
  title: string;
  description: string;
  value: string;
  cpv: string;
};

export type TenderSimpleItem = {
  id: string;
  title: string;
  description?: string;
  optional?: boolean;
  weight?: string | number;
  subcriteria?: TenderSimpleItem[];
};

export type TenderDetailData = {
  id: string;
  aiSummary: string;
  objectText: string;
  lastUpdated: string;
  publicationStatus: string;
  procedureType: string;
  contractType: string;
  fitScore: number;
  fitLabel: string;
  sourceUrl: string;
  headerBadges: TenderHeaderBadge[];
  overviewCards: TenderOverviewCard[];
  timeline: TenderTimelineItem[];
  signals: TenderDecisionSignal[];
  alerts: TenderInsightAlert[];
  pricingMetrics: TenderInsightMetric[];
  buyerMetrics: TenderInsightMetric[];
  guaranteeMetrics: TenderInsightMetric[];
  participants: TenderParticipant[];
  lots?: TenderLot[];
  requiredDocuments: TenderSimpleItem[];
  admissionCriteria: TenderSimpleItem[];
  awardCriteria: TenderSimpleItem[];
  tenderDocuments: TenderSimpleItem[];
};
