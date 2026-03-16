import { Check } from "lucide-react";
import type { TenderSimpleItem } from "../types/types";

type TenderRequiredDocumentsTabProps = {
  items: TenderSimpleItem[];
  complianceState: Record<string, boolean>;
  onToggleCompliance: (id: string) => void;
};

type EnvelopeGroup = {
  id: string;
  title: string;
  description: string;
  items: TenderSimpleItem[];
};

function getEnvelopeGroups(items: TenderSimpleItem[]): EnvelopeGroup[] {
  const administrativeKeywords = [
    "deuc",
    "deuc / self-declaration form",
    "self-declaration",
    "administrative",
    "tax",
    "social security",
    "classification",
    "solvency",
    "representation",
    "power of attorney",
    "commitment",
    "ute",
    "consortium",
    "bankruptcy",
  ];

  const judgementKeywords = [
    "technical proposal",
    "methodology",
    "work plan",
    "quality plan",
    "staffing",
    "technical memory",
    "execution proposal",
    "judgement",
    "subjective",
  ];

  const formulaKeywords = [
    "economic proposal",
    "offer price",
    "pricing",
    "formula",
    "discount",
    "financial offer",
    "bill of quantities",
    "cost breakdown",
    "formula-based",
  ];

  const matches = (item: TenderSimpleItem, keywords: string[]) => {
    const haystack = `${item.title} ${item.description ?? ""}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  };

  const administrative: TenderSimpleItem[] = [];
  const judgement: TenderSimpleItem[] = [];
  const formula: TenderSimpleItem[] = [];
  const leftovers: TenderSimpleItem[] = [];

  items.forEach((item) => {
    if (matches(item, formulaKeywords)) {
      formula.push(item);
      return;
    }

    if (matches(item, judgementKeywords)) {
      judgement.push(item);
      return;
    }

    if (matches(item, administrativeKeywords)) {
      administrative.push(item);
      return;
    }

    leftovers.push(item);
  });

  leftovers.forEach((item) => {
    if (administrative.length <= judgement.length) {
      administrative.push(item);
    } else {
      judgement.push(item);
    }
  });

  return [
    {
      id: "administrative-envelope",
      title: "Envelope 1 · Administrative documentation",
      description:
        "Legal, administrative and solvency documentation required to be admitted to the procedure.",
      items: administrative,
    },
    {
      id: "judgement-envelope",
      title: "Envelope 2 · Criteria subject to judgement of value",
      description:
        "Technical and qualitative documentation assessed through expert evaluation.",
      items: judgement,
    },
    {
      id: "formula-envelope",
      title: "Envelope 3 · Criteria assessed by formula",
      description:
        "Economic offer and formula-based documentation, including pricing proposal.",
      items: formula,
    },
  ].filter((group) => group.items.length > 0);
}

function EnvelopeSection({
  title,
  description,
  items,
  complianceState,
  onToggleCompliance,
}: {
  title: string;
  description: string;
  items: TenderSimpleItem[];
  complianceState: Record<string, boolean>;
  onToggleCompliance: (id: string) => void;
}) {
  const compliantCount = items.filter((item) => complianceState[item.id]).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 md:p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <p className="text-base font-semibold text-[#0B0F3A] md:text-lg">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Compliance
          </p>
          <p className="mt-0.5 text-xl font-semibold text-[#12C2C9] md:text-2xl">
            {compliantCount} / {items.length}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {items.map((item) => {
          const isCompliant = complianceState[item.id];

          return (
            <div
              key={item.id}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                isCompliant
                  ? "border-emerald-200 bg-emerald-50/70"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${
                        isCompliant ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium leading-6 text-[#0B0F3A]">
                        {item.title}
                      </p>
                      {item.description && (
                        <p className="mt-0.5 text-sm leading-6 text-slate-500">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggleCompliance(item.id)}
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all ${
                    isCompliant
                      ? "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
                      : "border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-[#0FB9B1]"
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
    </section>
  );
}

export default function TenderRequiredDocumentsTab({
  items,
  complianceState,
  onToggleCompliance,
}: TenderRequiredDocumentsTabProps) {
  const compliantCount = items.filter((item) => complianceState[item.id]).length;
  const envelopeGroups = getEnvelopeGroups(items);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 md:px-5">
        <p className="text-[11px] uppercase tracking-wide text-slate-400">
          Required documents
        </p>

        <div className="mt-1 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold text-[#12C2C9] md:text-4xl">
              {compliantCount} / {items.length}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Full checklist grouped by procurement envelopes for the bid submission.
            </p>
          </div>
        </div>
      </div>

      {envelopeGroups.map((group) => (
        <EnvelopeSection
          key={group.id}
          title={group.title}
          description={group.description}
          items={group.items}
          complianceState={complianceState}
          onToggleCompliance={onToggleCompliance}
        />
      ))}
    </div>
  );
}
