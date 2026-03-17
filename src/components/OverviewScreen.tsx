import { reviewItems } from "../data/mockData";

export default function OverviewScreen({
  onGoToDiscover,
}: {
  onGoToDiscover: () => void;
}) {
  const pipelineValue = "€8.6M";
  const pipelineAtRisk = "€1.2M";

  const reviewPreview = [...reviewItems].sort((a, b) => b.fit - a.fit).slice(0, 2);

  return (
    <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-4 px-4 py-1 sm:px-6 xl:min-h-[calc(100vh-88px)] xl:px-8">
      <div className="min-w-0">
        <p className="text-sm text-slate-500">Overview</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">Opportunity control panel</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-500">
          A single dashboard for pipeline execution, opportunity discovery and submitted offers.
        </p>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <div>
            <p className="text-sm text-slate-500">Active opportunities</p>
            <p className="text-3xl font-semibold leading-none text-[#0B0F3A]">{pipelineValue}</p>
          </div>
          <div className="rounded-2xl bg-red-50 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-red-700">This week</p>
            <p className="text-sm font-semibold text-red-800">{pipelineAtRisk} at deadline risk</p>
          </div>
        </div>

        <button className="rounded-2xl bg-[#0B0F3A] px-5 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
          View my opportunities
        </button>
      </div>

      <div className="grid flex-1 items-stretch gap-4 xl:grid-cols-3">
        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0B0F3A]">Pipeline at risk</h2>
                <p className="mt-1 text-sm text-slate-500">Opportunities with deadlines approaching</p>
              </div>
              <div className="rounded-2xl bg-red-50 px-3 py-2 text-right">
                <p className="text-[11px] font-medium uppercase text-red-700">This week</p>
                <p className="text-lg font-semibold text-red-800">{pipelineAtRisk}</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B0F3A]">Critical · deadline ≤ 3 days</p>
                    <div className="mt-2 rounded-xl bg-white/80 p-3">
                      <button className="block text-left text-sm font-medium text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        Madrid Metro Maintenance
                      </button>
                      <p className="mt-1 text-xs text-slate-600">Due in 2 days</p>
                    </div>
                  </div>
                  <button className="w-full rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9] sm:w-auto">
                    Continue proposal
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0B0F3A]">High risk · deadline ≤ 5 days</p>
                    <div className="mt-2 rounded-xl bg-white/80 p-3">
                      <button className="block text-left text-sm font-medium text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        Valencia Rail Infrastructure
                      </button>
                      <p className="mt-1 text-xs text-slate-600">Due in 5 days</p>
                    </div>
                  </div>
                  <button className="w-full rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9] sm:w-auto">
                    Continue proposal
                  </button>
                </div>
              </div>
            </div>
          </div>

          <button className="mt-4 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
            My Opportunities
          </button>
        </section>

        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-[#0B0F3A]">Proposal blockers</h2>
            <p className="mt-1 text-sm text-slate-500">Issues preventing proposals from progressing</p>

            <div className="mt-4 space-y-3">
              {[
                { label: "Missing documents", title: "→ Lisbon Water Systems", action: "Upload" },
                {
                  label: "Pending internal validation",
                  title: "→ Porto Infrastructure Project",
                  action: "Assign",
                },
                {
                  label: "Pricing sheet missing",
                  title: "→ Seville Transport Modernization",
                  action: "Complete",
                },
              ].map((blocker) => (
                <div
                  key={blocker.title}
                  className="rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0B0F3A]">{blocker.label}</p>
                      <button className="mt-1 block truncate text-left text-sm text-[#0B0F3A] underline decoration-slate-300 underline-offset-4 hover:text-[#0FB9B1]">
                        {blocker.title}
                      </button>
                    </div>
                    <button className="shrink-0 rounded-2xl border border-[#0FB9B1] px-4 py-2 text-sm font-medium text-[#0FB9B1] hover:bg-[#E8FBF9]">
                      {blocker.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button className="mt-4 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
            My Opportunities
          </button>
        </section>

        <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex-1">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#0B0F3A]">Opportunities to review</h2>
                <p className="mt-1 text-sm text-slate-500">High-fit opportunities not yet in your workspace</p>
              </div>
              <div className="inline-flex w-fit rounded-full bg-[#E8FBF9] px-3 py-1 text-xs font-semibold text-[#0FB9B1]">
                Ranked by fit score
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {reviewPreview.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#0FB9B1]"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <h3 className="font-medium text-[#0B0F3A]">{item.title}</h3>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded bg-[#E8FBF9] px-2 py-1 text-[#0FB9B1]">
                          Fit {item.fit}%
                        </span>
                        <span className="rounded bg-slate-100 px-2 py-1">{item.value}</span>
                        <span className="rounded bg-slate-100 px-2 py-1">Deadline {item.deadline}</span>
                      </div>
                    </div>
                    <button className="w-full rounded-xl border border-[#0FB9B1] px-4 py-2 text-[#0FB9B1] sm:w-auto">
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={onGoToDiscover}
            className="mt-4 w-full shrink-0 rounded-2xl bg-[#0B0F3A] px-4 py-3 text-sm font-medium text-white hover:bg-[#11175A]"
          >
            Discover
          </button>
        </section>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[#0B0F3A]">Offers in play</p>
            <p className="mt-1 text-sm text-slate-500">Submitted proposals awaiting outcome or follow-up.</p>
          </div>

          <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-[#0B0F3A]">
              8 under evaluation · €3.7M
            </span>
            <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-800">
              2 clarifications · €680K
            </span>
            <span className="rounded-full bg-[#E8FBF9] px-3 py-1.5 font-medium text-[#0FB9B1]">
              3 decisions this week · €1.4M
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 xl:grid-cols-2 xl:gap-4">
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-[#0B0F3A]">Madrid Metro Maintenance</p>
              <p className="mt-1 text-xs text-slate-500">€420K · Decision expected in 4 days</p>
              <p className="mt-2 text-sm text-slate-700">Final evaluation phase.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 px-4 py-3">
              <p className="text-sm font-semibold text-[#0B0F3A]">Lisbon Water Systems</p>
              <p className="mt-1 text-xs text-slate-500">€1.1M · Clarification requested</p>
              <p className="mt-2 text-sm text-slate-700">Missing administrative document.</p>
            </div>
          </div>

          <button className="shrink-0 rounded-2xl bg-[#0B0F3A] px-5 py-3 text-sm font-medium text-white hover:bg-[#11175A]">
            View submitted offers
          </button>
        </div>
      </section>
    </div>
  );
}
