import { Check, AlertTriangle, ShieldCheck } from "lucide-react";
import type { TenderSimpleItem } from "../types/types";

type TenderAdmissionCriteriaTabProps = {
  items: TenderSimpleItem[];
  complianceState: Record<string, boolean>;
  onToggleCompliance: (id: string) => void;
};

function EligibilityItem({
  item,
  isCompliant,
  onToggleCompliance,
}: {
  item: TenderSimpleItem;
  isCompliant: boolean;
  onToggleCompliance: (id: string) => void;
}) {
  return (
    <div
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
              <p className="text-base font-medium text-[#0B0F3A]">
                {item.title}
              </p>

              {item.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggleCompliance(item.id)}
          className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all ${
            isCompliant
              ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
              : "border-amber-200 bg-white text-amber-600 hover:bg-amber-50"
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
}

export default function TenderAdmissionCriteriaTab({
  items,
  complianceState,
  onToggleCompliance,
}: TenderAdmissionCriteriaTabProps) {
  const compliantItems = items.filter((item) => complianceState[item.id]);
  const missingItems = items.filter((item) => !complianceState[item.id]);
  const compliantCount = compliantItems.length;
  const totalCount = items.length;
  const isEligible = missingItems.length === 0;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              Eligibility check
            </p>

            <p className="mt-2 text-3xl font-semibold text-[#12C2C9]">
              {compliantCount} / {totalCount}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Company-level admission requirements needed to qualify for this procedure.
            </p>
          </div>

          <div
            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium ${
              isEligible
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isEligible ? (
              <ShieldCheck className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
            {isEligible ? "Eligible to participate" : "Eligibility gaps detected"}
          </div>
        </div>
      </div>

      {missingItems.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[#0B0F3A]">
                Missing or unconfirmed eligibility requirements
              </p>
              <p className="mt-1 text-sm text-slate-500">
                These are the company-level conditions that still need confirmation.
              </p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Pending
              </p>
              <p className="mt-1 text-2xl font-semibold text-amber-700">
                {missingItems.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {missingItems.map((item) => (
              <EligibilityItem
                key={item.id}
                item={item}
                isCompliant={false}
                onToggleCompliance={onToggleCompliance}
              />
            ))}
          </div>
        </section>
      )}

      {compliantItems.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[#0B0F3A]">
                Already satisfied
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Eligibility conditions that appear to be already covered by your company.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Confirmed
              </p>
              <p className="mt-1 text-2xl font-semibold text-emerald-700">
                {compliantItems.length}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {compliantItems.map((item) => (
              <EligibilityItem
                key={item.id}
                item={item}
                isCompliant={true}
                onToggleCompliance={onToggleCompliance}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
