import { Building2, Shield } from "lucide-react";
import BenchSummaryCard from "./BenchSummaryCard";
import BenchRankCard from "./BenchRankCard";
import { benchmarkPeriods, rankedBuyers, rankedSuppliers, reviewItems } from "../data/mockData";

export default function OverviewScreen({
  onGoToDiscover,
}: {
  onGoToDiscover: () => void;
}) {
  const pipelineValue = "€8.6M";
  const pipelineAtRisk = "€1.2M";

  return (
    <div className="mx-auto max-w-[1500px] space-y-8">
      <div>
        <p className="text-sm text-slate-500">Overview</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">
          Opportunity control panel
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          A single dashboard for pipeline execution, opportunity discovery and market context.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Active opportunities</p>
          <p className="text-3xl font-semibold text-[#0B0F3A]">{pipelineValue}</p>
          <p className="mt-1 text-sm text-slate-600">
            {pipelineAtRisk} at deadline risk this week
          </p>
        </div>

        <button className="rounded-2xl bg-[#0B0F3A] px-5 py-3 text-sm font-medium text-white">
          View my opportunities
        </button>
      </div>

      <div className="grid items-stretch gap-6 xl:grid-cols-3">
        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0B0F3A]">Pipeline at risk</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Opportunities with deadlines approaching
                </p>
              </div>
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-right">
                <p className="text-xs font-medium uppercase text-red-700">This week</p>
                <p className="text-lg font-semibold text-red-800">{pipelineAtRisk}</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full">
                    <p className="text-sm font-semibold text-[#0B0F3A]">
                      Critical · deadline ≤ 3 days
                    </p>
                    <div className="mt-3 rounded-xl bg-white/80 p-3">
                      <button className="block text-left text-sm font-medium text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        Madrid Metro Maintenance
                      </button>
                      <p className="mt-1 text-xs text-slate-600">Due in 2 days</p>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                    Continue proposal
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="w-full">
                    <p className="text-sm font-semibold text-[#0B0F3A]">
                      High risk · deadline ≤ 5 days
                    </p>
                    <div className="mt-3 rounded-xl bg-white/80 p-3">
                      <button className="block text-left text-sm font-medium text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        Valencia Rail Infrastructure
                      </button>
                      <p className="mt-1 text-xs text-slate-600">Due in 5 days</p>
                    </div>
                  </div>
                  <button className="shrink-0 rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                    Continue proposal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
            My Opportunities
          </button>
        </section>

        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#0B0F3A]">Proposal blockers</h2>
            <p className="mt-1 text-sm text-slate-500">
              Issues preventing proposals from progressing
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0B0F3A]">Missing documents</p>
                    <div className="mt-3 space-y-2">
                      <button className="block text-left text-sm text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        → Lisbon Water Systems
                      </button>
                    </div>
                  </div>
                  <button className="flex w-24 justify-center rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                    Upload
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0B0F3A]">
                      Pending internal validation
                    </p>
                    <div className="mt-3 space-y-2">
                      <button className="block text-left text-sm text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        → Porto Infrastructure Project
                      </button>
                    </div>
                  </div>
                  <button className="flex w-24 justify-center rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                    Assign
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0B0F3A]">Pricing sheet missing</p>
                    <div className="mt-3 space-y-2">
                      <button className="block text-left text-sm text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        → Seville Transport Modernization
                      </button>
                    </div>
                  </div>
                  <button className="flex w-24 justify-center rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                    Complete
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-6 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
            My Opportunities
          </button>
        </section>

        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0B0F3A]">
                  Opportunities to review
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  High-fit opportunities not yet in your workspace
                </p>
              </div>
              <div className="rounded-full bg-[#E8FBF9] px-3 py-1 text-xs font-semibold text-[#0FB9B1]">
                Ranked by fit score
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {reviewItems.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#0FB9B1]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-[#0B0F3A]">{item.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded bg-[#E8FBF9] px-2 py-1 text-[#0FB9B1]">
                          Fit {item.fit}%
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-1">{item.value}</span>
                        <span className="rounded bg-slate-100 px-2 py-1">
                          Deadline {item.deadline}
                        </span>
                      </div>
                    </div>
                    <button className="rounded-xl border border-[#0FB9B1] px-4 py-2 text-[#0FB9B1]">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onGoToDiscover}
            className="mt-6 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]"
          >
            Discover
          </button>
        </section>
      </div>

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[#0B0F3A]">Market snapshot</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#0B0F3A]">
              Benchmarks at a glance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Understand the market. Decide where to compete next.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span>Order by:</span>
            <button className="rounded-lg bg-white px-3 py-1 font-medium text-[#0B0F3A] shadow-sm">
              Awards
            </button>
            <button className="rounded-lg px-3 py-1">Award value</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {benchmarkPeriods.map((period) => (
            <BenchSummaryCard key={period.label} period={period} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <BenchRankCard
            title="Top buyers"
            subtitle="Based on last 12 months activity"
            items={rankedBuyers}
            cta="Discover more prospects"
            icon={<Building2 className="h-4 w-4" />}
          />

          <BenchRankCard
            title="Top competitors"
            subtitle="Based on last 12 months activity"
            items={rankedSuppliers}
            cta="Discover more competitors"
            icon={<Shield className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}