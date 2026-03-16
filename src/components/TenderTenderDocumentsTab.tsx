import type { TenderSimpleItem } from "../types/types";

type TenderTenderDocumentsTabProps = {
  items: TenderSimpleItem[];
};

export default function TenderTenderDocumentsTab({
  items,
}: TenderTenderDocumentsTabProps) {
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button
          onClick={(e) => e.preventDefault()}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-[#0B0F3A]"
        >
          Download all documents
        </button>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
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

              <button
                onClick={(e) => e.preventDefault()}
                className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-sm text-slate-600 hover:border-slate-300 hover:text-[#0B0F3A]"
              >
                Open
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
