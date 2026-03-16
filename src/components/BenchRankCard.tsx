import type { RankedEntity } from "../types/types";

function CompanyLink({ children }: { children: React.ReactNode }) {
  return <a className="cursor-pointer text-[#0FB9B1] hover:underline">{children}</a>;
}

export default function BenchRankCard({
  title,
  subtitle,
  items,
  cta,
  icon,
}: {
  title: string;
  subtitle: string;
  items: RankedEntity[];
  cta: string;
  icon: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{icon}</span>
            <h3 className="text-xl font-semibold text-[#0B0F3A]">{title}</h3>
          </div>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <button className="text-sm font-medium text-[#0FB9B1]">View all</button>
      </div>

      <div className="mt-5 space-y-5">
        {items.map((item, index) => (
          <div key={item.name} className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#0B0F3A]">
                  {index + 1}. <CompanyLink>{item.name}</CompanyLink>
                </p>
                <p className="mt-1 text-xs text-slate-500">{item.awards}</p>
              </div>
              <p className="text-xs font-medium text-slate-500">{item.volume}</p>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100">
              <div
                className="h-1.5 rounded-full bg-[#0FB9B1]"
                style={{ width: item.width }}
              />
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-[#0B0F3A] hover:border-[#0FB9B1]">
        {cta}
      </button>
    </section>
  );
}