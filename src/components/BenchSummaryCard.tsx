import type { BenchPeriod } from "../types/types";

export default function BenchSummaryCard({ period }: { period: BenchPeriod }) {
  return (
    <div className={`rounded-3xl border p-5 ${period.tone}`}>
      <div className="space-y-3">
        <p className="text-sm font-medium text-[#0B0F3A]">{period.label}</p>
        <div>
          <p className="text-3xl font-semibold text-[#0B0F3A]">{period.awards}</p>
          <p className="text-sm text-slate-500">Awards</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-[#0FB9B1]">{period.volume}</p>
          <p className="text-sm text-slate-500">Volume</p>
        </div>
      </div>
    </div>
  );
}