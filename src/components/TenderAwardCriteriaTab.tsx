
import type { TenderSimpleItem } from "../types/types";

type TenderAwardCriteriaTabProps = {
  items: TenderSimpleItem[];
};

export default function TenderAwardCriteriaTab({
  items,
}: TenderAwardCriteriaTabProps) {

  return (
    <div className="space-y-5">

      {/* Criteria blocks */}
      <div className="space-y-4">
        {items.map((item) => {
          const sub = (item as any).subcriteria || [];
          const weight = (item as any).weight;

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-[#0B0F3A]">
                    {item.title}
                  </p>

                  {weight && (
                    <p className="text-sm text-slate-500 mt-1">
                      {weight} points
                    </p>
                  )}
                </div>
              </div>

              {sub.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3 space-y-2">
                  {sub.map((s: any) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-700">{s.title}</span>

                      {s.weight && (
                        <span className="text-slate-500">
                          {s.weight} pts
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
