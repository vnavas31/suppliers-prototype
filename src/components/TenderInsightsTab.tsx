import { AlertTriangle, Check, CheckCircle2 } from "lucide-react";
import type {
  TenderDetailData,
  TenderDetailTab,
  TenderSimpleItem,
} from "../types/types";

type ComplianceState = {
  documents: Record<string, boolean>;
  admission: Record<string, boolean>;
};

type MyBenchmark = {
  successRate: number;
  successRateLabel: string;
  avgDiscount: number;
  avgDiscountLabel: string;
  contractsWithBuyer: number;
};

type TenderInsightsTabProps = {
  detail: TenderDetailData;
  myBenchmark: MyBenchmark;
  complianceState: ComplianceState;
  documentAlertIds: string[];
  admissionAlertIds: string[];
  onToggleDocumentCompliance: (id: string) => void;
  onToggleAdmissionCompliance: (id: string) => void;
  onChangeTab: (tab: TenderDetailTab) => void;
  basePriceValue: string;
  idealDiscount: number;
  offerPrice: string;
};

function ComplianceCard({
  title,
  items,
  state,
  initialMissingIds,
  onToggle,
  overflowCount,
  onSeeMore,
  footerLinkText,
}: {
  title: string;
  items: TenderSimpleItem[];
  state: Record<string, boolean>;
  initialMissingIds: string[];
  onToggle: (id: string) => void;
  overflowCount: number;
  onSeeMore: () => void;
  footerLinkText?: string;
}) {
  const total = items.length;
  const compliantCount = items.filter((item) => state[item.id]).length;
  const hasOpenAlerts = initialMissingIds.some((id) => !state[id]);

  const visibleAlertItems = initialMissingIds
    .slice(0, 2)
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is TenderSimpleItem => Boolean(item));

  return (
    <div
      className={`flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm ${
        hasOpenAlerts
          ? "border-amber-300 ring-1 ring-amber-200/70"
          : "border-emerald-300 ring-1 ring-emerald-200/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[85%] text-lg font-semibold leading-tight text-[#0B0F3A]">
          {title}
        </h3>
        <span
          className={`mt-1 h-4 w-4 rounded-full ${
            hasOpenAlerts ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </div>

      <p className="mt-6 text-[3rem] font-semibold leading-none tracking-tight text-[#12C2C9] xl:text-[3.5rem]">
        {compliantCount} out of {total}
      </p>

      <div className="mt-6 space-y-3 flex-1">
        {visibleAlertItems.map((item) => {
          const isCompliant = state[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 transition-colors ${
                isCompliant
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-amber-200 bg-amber-50/50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        isCompliant ? "bg-emerald-500" : "bg-[#0B0F3A]"
                      }`}
                    />
                    <div>
                      <p className="text-base text-slate-700">{item.title}</p>
                      {item.description && (
                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggle(item.id)}
                  aria-label={
                    isCompliant
                      ? "Mark as not compliant"
                      : "Mark as compliant"
                  }
                  title={
                    isCompliant
                      ? "Mark as not compliant"
                      : "Mark as compliant"
                  }
                  className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all ${
                    isCompliant
                      ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-[#0FB9B1] hover:bg-slate-50"
                  }`}
                >
                  <Check
                    className={`h-4 w-4 ${
                      isCompliant ? "stroke-[2.5]" : "stroke-[2.25]"
                    }`}
                  />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {(overflowCount > 0 || footerLinkText) && (
        <div className="mt-auto pt-4">
          <button
            onClick={onSeeMore}
            className="text-sm font-medium text-[#0FB9B1] hover:underline"
          >
            {footerLinkText ?? "See more"}
          </button>
        </div>
      )}
    </div>
  );
}

function EligibilityCard({
  items,
  state,
  initialMissingIds,
  onToggle,
  onSeeMore,
}: {
  items: TenderSimpleItem[];
  state: Record<string, boolean>;
  initialMissingIds: string[];
  onToggle: (id: string) => void;
  onSeeMore: () => void;
}) {
  const total = items.length;
  const compliantCount = items.filter((item) => state[item.id]).length;
  const visibleEligibilityItems = initialMissingIds
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is TenderSimpleItem => Boolean(item))
    .slice(0, 3);
  const hasOpenEligibilityAlerts = initialMissingIds.some((id) => !state[id]);
  const isEligible = !hasOpenEligibilityAlerts;

  return (
    <div
      className={`relative flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm ${
        isEligible
          ? "border-emerald-300 ring-1 ring-emerald-200/70"
          : "border-amber-300 ring-1 ring-amber-200/70"
      }`}
    >
      <div className="flex items-start gap-3">
        <h3 className="max-w-[85%] text-lg font-semibold leading-tight text-[#0B0F3A]">
          Eligibility check
        </h3>
      </div>

      <span
        className={`absolute right-5 top-5 h-4 w-4 rounded-full ${
          isEligible ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />

      <div className="mt-6">
        <p className="text-[3rem] font-semibold leading-none tracking-tight text-[#12C2C9] xl:text-[3.5rem]">
          {compliantCount}/{total}
        </p>

        <div className="mt-3">
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ${
              isEligible
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {isEligible ? "Eligible" : "Review needed"}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        Company-level eligibility conditions required to participate in this procedure.
      </p>

      {visibleEligibilityItems.length > 0 ? (
        <div className="mt-6 flex-1 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Missing or unconfirmed
          </p>

          {visibleEligibilityItems.map((item) => {
            const isCompliant = state[item.id];

            return (
              <div
                key={item.id}
                className={`rounded-2xl border p-4 transition-colors ${
                  isCompliant
                    ? "border-emerald-200 bg-emerald-50/70"
                    : "border-amber-200 bg-amber-50/50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                          isCompliant ? "bg-emerald-500" : "bg-amber-500"
                        }`}
                      />
                      <div>
                        <p className="text-base text-slate-700">{item.title}</p>
                        {item.description && (
                          <p className="mt-1 text-sm text-slate-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onToggle(item.id)}
                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border shadow-sm transition-all ${
                      isCompliant
                        ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300"
                        : "border-amber-200 bg-white text-amber-600 hover:bg-amber-50"
                    }`}
                    aria-label={
                      isCompliant ? "Mark as not compliant" : "Mark as compliant"
                    }
                    title={
                      isCompliant ? "Mark as not compliant" : "Mark as compliant"
                    }
                  >
                    <Check className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
            <p className="text-sm font-semibold">
              All eligibility conditions currently appear to be covered
            </p>
          </div>
        </div>
      )}

      <div className="mt-auto pt-4">
        <button
          onClick={onSeeMore}
          className="text-sm font-medium text-[#0FB9B1] hover:underline"
        >
          Review full admission criteria
        </button>
      </div>
    </div>
  );
}

function EvaluationStructureCard({
  detail,
  onSeeMore,
}: {
  detail: TenderDetailData;
  onSeeMore: () => void;
}) {
  const criteria = ((detail as any).awardCriteria ?? []) as Array<any>;

  const summary = criteria.reduce(
    (acc, criterion) => {
      const title = String(criterion.title ?? "").toLowerCase();
      const weight = Number(criterion.weight ?? 0) || 0;
      const subcriteria = Array.isArray(criterion.subcriteria)
        ? criterion.subcriteria
        : [];

      if (
        title.includes("formula") ||
        title.includes("price") ||
        title.includes("economic")
      ) {
        acc.pricePoints += weight;
        acc.priceCriteria += subcriteria.length || 1;
      } else {
        acc.technicalPoints += weight;
        acc.technicalCriteria += subcriteria.length || 1;
      }

      return acc;
    },
    {
      pricePoints: 0,
      technicalPoints: 0,
      priceCriteria: 0,
      technicalCriteria: 0,
    }
  );

  const totalCriteria = summary.priceCriteria + summary.technicalCriteria;

  return (
    <div className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[85%] text-lg font-semibold leading-tight text-[#0B0F3A]">
          Evaluation criteria
        </h3>
        <span className="mt-1 h-4 w-4 rounded-full bg-slate-300" />
      </div>

      <div className="mt-6 flex items-start justify-between gap-4">
        <p className="text-[3rem] font-semibold leading-none tracking-tight text-[#12C2C9] xl:text-[3.5rem]">
          {summary.pricePoints} / {summary.technicalPoints}
        </p>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-600">
          {totalCriteria} criteria
        </span>
      </div>

      <div className="mt-5 space-y-3 flex-1">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-600">Price criteria</span>
            <span className="font-semibold text-[#0B0F3A]">
              {summary.pricePoints} pts
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="text-slate-600">Technical criteria</span>
            <span className="font-semibold text-[#0B0F3A]">
              {summary.technicalPoints} pts
            </span>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          {summary.priceCriteria} price criteria · {summary.technicalCriteria} technical subcriteria
        </p>
      </div>

      <div className="mt-auto pt-4">
        <button
          onClick={onSeeMore}
          className="text-sm font-medium text-[#0FB9B1] hover:underline"
        >
          View full award criteria
        </button>
      </div>
    </div>
  );
}

function DepositCard({ detail }: { detail: TenderDetailData }) {
  const provisionalMetric = detail.guaranteeMetrics.find((metric) =>
    metric.title.toLowerCase().includes("provisional")
  );
  const mainMetric = provisionalMetric ?? detail.guaranteeMetrics[0];
  const secondaryMetrics = detail.guaranteeMetrics.filter(
    (metric) => metric.title !== mainMetric?.title
  );
  const hasProvisionalGuarantee = Boolean(provisionalMetric);

  return (
    <div
      className={`flex h-full flex-col rounded-3xl border bg-white p-5 shadow-sm ${
        hasProvisionalGuarantee
          ? "border-amber-300 ring-1 ring-amber-200/70"
          : "border-emerald-300 ring-1 ring-emerald-200/70"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="max-w-[85%] text-lg font-semibold leading-tight text-[#0B0F3A]">
          Required Deposit/Warranties
        </h3>
        <span
          className={`mt-1 h-4 w-4 rounded-full ${
            hasProvisionalGuarantee ? "bg-amber-500" : "bg-emerald-500"
          }`}
        />
      </div>

      <p className="mt-6 text-[3rem] font-semibold leading-none tracking-tight text-[#12C2C9] xl:text-[3.5rem]">
        {mainMetric?.value ?? "Not specified"}
      </p>

      <p className="mt-3 text-lg text-slate-600">
        {mainMetric?.subtitle ??
          (hasProvisionalGuarantee
            ? "Provisional guarantee detected in tender documents"
            : "No provisional guarantee highlighted")}
      </p>

      <div
        className={`mt-6 rounded-2xl p-4 ${
          hasProvisionalGuarantee ? "bg-amber-50" : "bg-emerald-50"
        }`}
      >
        <div
          className={`flex items-center gap-2 ${
            hasProvisionalGuarantee ? "text-amber-700" : "text-emerald-700"
          }`}
        >
          {hasProvisionalGuarantee ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
          <p className="text-sm font-semibold">
            {hasProvisionalGuarantee
              ? "Required before submitting the bid"
              : "Similar deposit provided"}
          </p>
        </div>

        {secondaryMetrics.length > 0 ? (
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            {secondaryMetrics.map((metric) => (
              <div key={metric.title}>
                <span className="font-medium text-slate-700">
                  {metric.title}:{" "}
                </span>
                <span>{metric.value}</span>
                {metric.subtitle && <span> · {metric.subtitle}</span>}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-600">
            {hasProvisionalGuarantee
              ? "This guarantee is required to participate, regardless of the final award outcome."
              : "Historical guarantee information available in similar tenders."}
          </p>
        )}
      </div>
    </div>
  );
}

function parsePercent(value: string) {
  return Number(value.replace("%", "").replace(",", ".").trim()) || 0;
}

function parseCount(value: string | number) {
  return typeof value === "number" ? value : Number(value) || 0;
}

function getRelativePosition(
  participant: {
    successRate: string;
    contractsWithBuyer: string | number;
  },
  benchmark: MyBenchmark
) {
  const successRate = parsePercent(participant.successRate);
  const buyerContracts = parseCount(participant.contractsWithBuyer);

  let score = 0;

  if (successRate > benchmark.successRate) score -= 1;
  if (successRate < benchmark.successRate) score += 1;

  if (buyerContracts > benchmark.contractsWithBuyer) score -= 1;
  if (buyerContracts < benchmark.contractsWithBuyer) score += 1;

  if (score >= 1) {
    return "bg-emerald-50/70";
  }

  if (score <= -1) {
    return "bg-rose-50/70";
  }

  return "bg-amber-50/60";
}

export default function TenderInsightsTab({
  detail,
  myBenchmark,
  complianceState,
  documentAlertIds,
  admissionAlertIds,
  onToggleDocumentCompliance,
  onToggleAdmissionCompliance,
  onChangeTab,
  basePriceValue,
  idealDiscount,
  offerPrice,
}: TenderInsightsTabProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ComplianceCard
          title="Required Documents"
          items={detail.requiredDocuments}
          state={complianceState.documents}
          initialMissingIds={documentAlertIds}
          onToggle={onToggleDocumentCompliance}
          overflowCount={Math.max(documentAlertIds.length - 2, 0)}
          onSeeMore={() => onChangeTab("requiredDocuments")}
          footerLinkText="Review full required documents"
        />

        <EligibilityCard
          items={detail.admissionCriteria}
          state={complianceState.admission}
          initialMissingIds={admissionAlertIds}
          onToggle={onToggleAdmissionCompliance}
          onSeeMore={() => onChangeTab("admissionCriteria")}
        />

        <EvaluationStructureCard
          detail={detail}
          onSeeMore={() => onChangeTab("awardCriteria")}
        />

        <DepositCard detail={detail} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-lg font-semibold text-[#0B0F3A]">
                Expected participants vs you
              </p>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
                {detail.participants.length} profiles
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Quick benchmark to assess where you are stronger or weaker.
            </p>
          </div>

          <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 xl:min-w-[360px]">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-violet-500">
                  Base price
                </p>
                <p className="mt-1 text-lg font-semibold text-violet-700">
                  {basePriceValue}
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-violet-500">
                  Ideal discount
                </p>
                <p className="mt-1 text-lg font-semibold text-violet-700">
                  {idealDiscount.toFixed(1)}%
                </p>
              </div>

              <div>
                <p className="text-xs uppercase tracking-wide text-violet-500">
                  Offer price
                </p>
                <p className="mt-1 text-lg font-semibold text-violet-700">
                  {offerPrice}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Your success rate
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0B0F3A]">
              {myBenchmark.successRateLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Your avg. discount
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0B0F3A]">
              {myBenchmark.avgDiscountLabel}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Your contracts with this buyer
            </p>
            <p className="mt-2 text-2xl font-semibold text-[#0B0F3A]">
              {myBenchmark.contractsWithBuyer}
            </p>
          </div>
        </div>

        <div className="mt-5 hidden xl:block overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4">Company</th>
                <th className="px-4">Success rate</th>
                <th className="px-4">Avg. discount</th>
                <th className="px-4">Contracts with this buyer</th>
              </tr>
            </thead>
            <tbody>
              {detail.participants.map((participant) => {
                const rowTone = getRelativePosition(participant, myBenchmark);

                return (
                  <tr
                    key={participant.id}
                    className={`overflow-hidden rounded-2xl ${rowTone}`}
                  >
                    <td className="rounded-l-2xl px-4 py-4 align-top">
                      <a
                        href="#"
                        onClick={(event) => event.preventDefault()}
                        className="text-sm font-semibold text-[#0B0F3A] hover:underline"
                      >
                        {participant.name}
                      </a>
                      <p className="mt-1 text-xs text-slate-400">
                        {participant.fiscalId}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p className="font-medium text-[#0B0F3A]">
                        {participant.successRate}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-slate-600">
                      <p className="font-medium text-[#0B0F3A]">
                        {participant.avgDiscount}
                      </p>
                    </td>
                    <td className="rounded-r-2xl px-4 py-4 align-top text-sm text-slate-600">
                      <p className="font-medium text-[#0B0F3A]">
                        {participant.contractsWithBuyer}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 space-y-3 xl:hidden">
          {detail.participants.map((participant) => {
            const rowTone = getRelativePosition(participant, myBenchmark);

            return (
              <div
                key={participant.id}
                className={`rounded-2xl border border-slate-200 p-4 ${rowTone}`}
              >
                <div>
                  <a
                    href="#"
                    onClick={(event) => event.preventDefault()}
                    className="text-sm font-semibold text-[#0B0F3A] hover:underline"
                  >
                    {participant.name}
                  </a>
                  <p className="mt-1 text-xs text-slate-400">
                    {participant.fiscalId}
                  </p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Success rate
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0B0F3A]">
                      {participant.successRate}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Avg. discount
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0B0F3A]">
                      {participant.avgDiscount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Contracts with this buyer
                    </p>
                    <p className="mt-1 text-sm font-medium text-[#0B0F3A]">
                      {participant.contractsWithBuyer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
