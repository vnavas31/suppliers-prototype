import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  Eye,
  Link2,
  Share2,
  Heart,
  BriefcaseBusiness,
  ChevronDown,
} from "lucide-react";
import type {
  SimplifaerItemContext,
  TenderDetailData,
  TenderDetailTab,
  TenderSimpleItem,
} from "../types/types";
import { getTenderDetailData } from "../data/tenderDetailData";
import {
  defaultTenderScenario,
  tenderScenariosById,
  type TenderScenarioMock,
} from "../data/mockData";
import TenderInsightsTab from "./TenderInsightsTab";
import TenderRequiredDocumentsTab from "./TenderRequiredDocumentsTab";
import TenderAdmissionCriteriaTab from "./TenderAdmissionCriteriaTab";
import TenderAwardCriteriaTab from "./TenderAwardCriteriaTab";
import TenderTenderDocumentsTab from "./TenderTenderDocumentsTab";

function toneClass(
  tone?: "neutral" | "teal" | "purple" | "amber"
): string {
  switch (tone) {
    case "teal":
      return "bg-[#E8FBF9] text-[#0FB9B1]";
    case "purple":
      return "bg-violet-50 ";
    case "amber":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}


function getFitScoreStyle(score: number) {
  if (score >= 80) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (score >= 60) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-rose-200 bg-rose-50 text-rose-700";
}

function SectionList({ items }: { items: TenderSimpleItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="rounded-2xl border border-slate-200 bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#0B0F3A]">
                {item.title}
              </p>
              {item.description && (
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

type ComplianceState = {
  documents: Record<string, boolean>;
  admission: Record<string, boolean>;
};

function buildDefaultSectionState(
  items: TenderSimpleItem[],
  compliantCount: number
) {
  return items.reduce<Record<string, boolean>>((acc, item, index) => {
    acc[item.id] = index >= items.length - compliantCount;
    return acc;
  }, {});
}

function buildDefaultComplianceState(
  detail: TenderDetailData,
  scenario: TenderScenarioMock
): ComplianceState {
  return {
    documents: buildDefaultSectionState(
      detail.requiredDocuments,
      scenario.complianceDefaults.documentsCompliantCount
    ),
    admission: buildDefaultSectionState(
      detail.admissionCriteria,
      scenario.complianceDefaults.admissionCompliantCount
    ),
  };
}

function normalizeComplianceState(
  detail: TenderDetailData,
  scenario: TenderScenarioMock,
  raw: Partial<ComplianceState> | null | undefined
): ComplianceState {
  const fallback = buildDefaultComplianceState(detail, scenario);

  const documents = detail.requiredDocuments.reduce<Record<string, boolean>>(
    (acc, item) => {
      acc[item.id] = raw?.documents?.[item.id] ?? fallback.documents[item.id];
      return acc;
    },
    {}
  );

  const admission = detail.admissionCriteria.reduce<Record<string, boolean>>(
    (acc, item) => {
      acc[item.id] = raw?.admission?.[item.id] ?? fallback.admission[item.id];
      return acc;
    },
    {}
  );

  return { documents, admission };
}

function getComplianceStorageKey(tenderId: string) {
  return `tender-detail-compliance:v3:${tenderId}`;
}

function parsePercent(value: string) {
  return Number(value.replace("%", "").replace(",", ".").trim()) || 0;
}

function parseCurrencyToNumber(value: string) {
  const clean = value.replace(/[€\s]/g, "").toUpperCase();

  if (clean.includes("M")) {
    return (
      (Number(clean.replace("M", "").replace(",", ".")) || 0) * 1_000_000
    );
  }

  if (clean.includes("K")) {
    return (
      (Number(clean.replace("K", "").replace(",", ".")) || 0) * 1_000
    );
  }

  return Number(clean.replace(",", ".")) || 0;
}

function formatCurrencyCompact(value: number) {
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(2).replace(".", ",");
    return `${formatted}M €`;
  }

  if (value >= 1_000) {
    const formatted = Math.round(value / 1_000);
    return `${formatted}K €`;
  }

  return `${Math.round(value)} €`;
}

function createEuropeanPercentValue(value: number): number {
  return {
    toFixed: (digits: number) => value.toFixed(digits).replace(".", ","),
    valueOf: () => value,
  } as unknown as number;
}

export default function TenderDetailScreen({
  context,
  onBack,
  onOpenSimplifaer,
}: {
  context: SimplifaerItemContext | null;
  onBack: () => void;
  onOpenSimplifaer: (context?: SimplifaerItemContext) => void;
}) {
  const detail = useMemo<TenderDetailData | null>(() => {
    if (!context) return null;
    return getTenderDetailData(context.id);
  }, [context]);

  const scenario = useMemo<TenderScenarioMock>(() => {
    if (!context) return defaultTenderScenario;
    return tenderScenariosById[context.id] ?? defaultTenderScenario;
  }, [context]);

  const [activeTab, setActiveTab] = useState<TenderDetailTab>("insights");
  const [showFullObject, setShowFullObject] = useState(false);
  const [complianceState, setComplianceState] =
    useState<ComplianceState | null>(null);

  useEffect(() => {
    if (!context || !detail) {
      setComplianceState(null);
      return;
    }

    const storageKey = getComplianceStorageKey(context.id);
    const raw =
      typeof window !== "undefined"
        ? window.localStorage.getItem(storageKey)
        : null;
    const parsed = raw ? (JSON.parse(raw) as Partial<ComplianceState>) : null;
    setComplianceState(normalizeComplianceState(detail, scenario, parsed));
  }, [context, detail, scenario]);

  useEffect(() => {
    if (!context || !complianceState || typeof window === "undefined") return;
    window.localStorage.setItem(
      getComplianceStorageKey(context.id),
      JSON.stringify(complianceState)
    );
  }, [context, complianceState]);

  if (!context || !detail) return null;

  const objectText =
    detail.objectText ??
    "Object of the contract not available in the current prototype.";

  const tabs: Array<{
    id: TenderDetailTab;
    label: string;
    visible: boolean;
  }> = [
    { id: "insights", label: "Insights", visible: true },
    { id: "lots", label: "Lots", visible: Boolean(detail.lots?.length) },
    {
      id: "requiredDocuments",
      label: "Required Documents",
      visible: true,
    },
    {
      id: "admissionCriteria",
      label: "Admission Criteria",
      visible: true,
    },
    {
      id: "awardCriteria",
      label: "Award Criteria",
      visible: true,
    },
    {
      id: "tenderDocuments",
      label: "Tender Documents",
      visible: true,
    },
  ];

  const safeComplianceState =
    complianceState ?? buildDefaultComplianceState(detail, scenario);

  const defaultCompliance = buildDefaultComplianceState(detail, scenario);

  const documentAlertIds = detail.requiredDocuments
    .filter((item) => !defaultCompliance.documents[item.id])
    .map((item) => item.id);

  const admissionAlertIds = detail.admissionCriteria
    .filter((item) => !defaultCompliance.admission[item.id])
    .map((item) => item.id);

  const myBenchmark = scenario.myBenchmark;

  const commercialSnapshotCard = detail.overviewCards.find(
    (card) => card.title === "Commercial snapshot"
  );

  const budgetLine = commercialSnapshotCard?.lines.find(
    (line) => line.label === "Budget excl. VAT"
  );

  const rawBasePriceValue = budgetLine?.value ?? "€0";
  const basePriceNumber = parseCurrencyToNumber(rawBasePriceValue);
  const basePriceValue = formatCurrencyCompact(basePriceNumber);

  const competitorDiscounts = detail.participants.map((participant) =>
    parsePercent(participant.avgDiscount)
  );

  const idealDiscount = Number(
    (
      Math.max(myBenchmark.avgDiscount, ...competitorDiscounts) +
      scenario.pricing.idealDiscountDelta
    ).toFixed(1)
  );
  const idealDiscountDisplayValue = createEuropeanPercentValue(idealDiscount);

  const offerPrice = basePriceNumber * (1 - idealDiscount / 100);

  const toggleDocumentCompliance = (id: string) => {
    setComplianceState((current) => {
      if (!current) return current;
      return {
        ...current,
        documents: {
          ...current.documents,
          [id]: !current.documents[id],
        },
      };
    });
  };

  const toggleAdmissionCompliance = (id: string) => {
    setComplianceState((current) => {
      if (!current) return current;
      return {
        ...current,
        admission: {
          ...current.admission,
          [id]: !current.admission[id],
        },
      };
    });
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-4 xl:px-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition-colors hover:border-slate-300 hover:text-[#0B0F3A]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenSimplifaer(context)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 text-sm font-medium  transition-colors hover:bg-violet-100"
          >
            <Sparkles className="h-4 w-4" />
            Simplifaer
          </button>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0B0F3A]">
            <Link2 className="h-4 w-4" />
          </button>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0B0F3A]">
            <Share2 className="h-4 w-4" />
          </button>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-500">
            <Heart className="h-4 w-4" />
          </button>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0B0F3A]">
            <BriefcaseBusiness className="h-4 w-4" />
          </button>

          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#0B0F3A]">
            <Eye className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {(detail.headerBadges ?? []).map((badge) => (
              <span
                key={badge.label}
                className={`rounded-full px-3 py-1 text-xs font-medium ${toneClass(
                  badge.tone
                )}`}
              >
                {badge.label}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {context.id}
              </p>

              <h1 className="text-3xl font-semibold leading-tight text-[#0B0F3A] xl:text-4xl">
                {context.title}
              </h1>

              <p className="text-base font-medium text-[#0FB9B1]">
                {context.buyer}
              </p>

              <div className="max-w-[1080px]">
                <p className="text-sm leading-7 text-slate-600">
                  {showFullObject
                    ? objectText
                    : `${objectText.slice(0, 210)}${
                        objectText.length > 210 ? "..." : ""
                      }`}
                </p>

                {objectText.length > 210 && (
                  <button
                    onClick={() => setShowFullObject((current) => !current)}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-[#0FB9B1]"
                  >
                    {showFullObject ? "Show less" : "Show more"}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showFullObject ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            </div>

            <div className={`shrink-0 rounded-2xl border p-5 xl:w-[300px] ${getFitScoreStyle(Number(detail.fitScore ?? context.badge.replace("Fit ","").replace("%","")))}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide ">
                    AI Fit score
                  </p>
                  <p className="mt-2 text-4xl font-semibold ">
                    {detail.fitScore ??
                      context.badge.replace("Fit ", "").replace("%", "")}
                    %
                  </p>
                  <p className="mt-2 text-sm font-medium ">
                    {detail.fitLabel ?? "Strong fit"}
                  </p>
                </div>

                <Sparkles className="h-5 w-5 " />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {detail.overviewCards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-slate-200 bg-white p-5"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <p className="text-sm font-semibold text-[#0B0F3A]">
                {card.title}
              </p>
              {card.topMeta && (
                <span className="text-xs text-slate-400">{card.topMeta}</span>
              )}
            </div>

            <div className="space-y-3">
              {card.lines.map((line) => (
                <div key={`${card.title}-${line.label}`}>
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {line.label}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      line.tone === "strong"
                        ? "font-semibold text-[#0B0F3A]"
                        : line.tone === "teal"
                          ? "font-medium text-[#0FB9B1]"
                          : "text-slate-600"
                    }`}
                  >
                    {line.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs
          .filter((tab) => tab.visible)
          .map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[#0B0F3A] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
      </div>

      {activeTab === "insights" && (
        <TenderInsightsTab
          detail={detail}
          myBenchmark={myBenchmark}
          complianceState={safeComplianceState}
          documentAlertIds={documentAlertIds}
          admissionAlertIds={admissionAlertIds}
          onToggleDocumentCompliance={toggleDocumentCompliance}
          onToggleAdmissionCompliance={toggleAdmissionCompliance}
          onChangeTab={setActiveTab}
          basePriceValue={basePriceValue}
          idealDiscount={idealDiscountDisplayValue}
          offerPrice={formatCurrencyCompact(offerPrice)}
        />
      )}

      {activeTab === "requiredDocuments" && (
        <TenderRequiredDocumentsTab
          items={detail.requiredDocuments}
          complianceState={safeComplianceState.documents}
          onToggleCompliance={toggleDocumentCompliance}
        />
      )}

      {activeTab === "admissionCriteria" && (
        <TenderAdmissionCriteriaTab
          items={detail.admissionCriteria}
          complianceState={safeComplianceState.admission}
          onToggleCompliance={toggleAdmissionCompliance}
        />
      )}

      {activeTab === "awardCriteria" && (
        <TenderAwardCriteriaTab items={detail.awardCriteria} />
      )}

      {activeTab === "tenderDocuments" && (
        <TenderTenderDocumentsTab items={detail.tenderDocuments} />
      )}

      {activeTab === "lots" && detail.lots && (
        <SectionList
          items={detail.lots.map((lot) => ({
            id: lot.id,
            title: `${lot.title} · ${lot.value}`,
            description: `${lot.description} · CPV ${lot.cpv}`,
          }))}
        />
      )}
    </div>
  );
}
