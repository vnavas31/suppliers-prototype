import {
  LayoutDashboard,
  Search,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Building2,
  Shield,
  Sparkles,
  Bot,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
  FileText,
} from "lucide-react";
import { useMemo, useState } from "react";

type Page = "overview" | "discover" | "simplifaer";
type DiscoverTab = "active" | "forecast";
type ViewMode = "list" | "cards";

type SavedFilter = {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
};

type ReviewItem = {
  title: string;
  fit: number;
  value: string;
  deadline: string;
};

type Opportunity = {
  id: string;
  title: string;
  buyer: string;
  value: string;
  location: string;
  deadline: string;
  score: number;
  procedure: string;
};

type ForecastContract = {
  id: string;
  title: string;
  buyer: string;
  value: string;
  renewal: string;
  probability: number;
};

type BenchPeriod = {
  label: string;
  awards: string;
  volume: string;
  tone: string;
};

type RankedEntity = {
  name: string;
  awards: string;
  volume: string;
  width: string;
};

type SimplifaerItemContext = {
  id: string;
  title: string;
  buyer: string;
  value: string;
  subtitle: string;
  badge: string;
  type: "tender" | "contract";
};

type DrawerAction = {
  label: string;
  kind: "local" | "external" | "workspace";
};

const reviewItems: ReviewItem[] = [
  { title: "Barcelona Tramway Extension", fit: 94, value: "€2.1M", deadline: "18 days" },
  { title: "Lisbon Mobility Infrastructure", fit: 89, value: "€1.3M", deadline: "16 days" },
  { title: "Valencia Water Treatment Upgrade", fit: 84, value: "€760K", deadline: "21 days" },
];

const opportunities: Opportunity[] = [
  {
    id: "IT-2024-0123",
    title: "IT Infrastructure Modernization",
    buyer: "Zaragoza City Council",
    value: "€2.45M",
    location: "Zaragoza",
    deadline: "25 Mar 2026",
    score: 92,
    procedure: "Open procedure",
  },
  {
    id: "CYBER-2024-234",
    title: "Cybersecurity Services",
    buyer: "Comunidad de Madrid",
    value: "€1.95M",
    location: "Madrid",
    deadline: "28 Mar 2026",
    score: 91,
    procedure: "Open procedure",
  },
  {
    id: "CLOUD-2024-087",
    title: "Cloud Services Contract",
    buyer: "Generalitat de Catalunya",
    value: "€4.8M",
    location: "Barcelona",
    deadline: "22 Mar 2026",
    score: 88,
    procedure: "Open procedure",
  },
];

const savedFilters: SavedFilter[] = [
  {
    id: "f1",
    name: "Healthcare Spain · High fit",
    description: "Spain · Healthcare · Fit score > 85",
    isDefault: true,
  },
  {
    id: "f2",
    name: "Public IT Madrid",
    description: "Madrid · IT services · Value > €1M",
  },
  {
    id: "f3",
    name: "Expiring transport contracts",
    description: "Forecast · Transport · Expiring soon",
  },
  {
    id: "f4",
    name: "Construction Iberia",
    description: "Spain + Portugal · Construction · Value > €2M",
  },
  {
    id: "f5",
    name: "Universities hardware",
    description: "Universities · IT hardware · Search in documents",
  },
  {
    id: "f6",
    name: "Municipal mobility",
    description: "Municipal buyers · Mobility · Deadlines within 30 days",
  },
];

const forecastContracts: ForecastContract[] = [
  {
    id: "CONTRACT-001",
    title: "Metro Maintenance Contract",
    buyer: "Madrid Metro",
    value: "€12M",
    renewal: "Expected renewal in 4 months",
    probability: 78,
  },
  {
    id: "CONTRACT-002",
    title: "City IT Services",
    buyer: "Lisbon Municipality",
    value: "€8M",
    renewal: "Expected renewal in 6 months",
    probability: 65,
  },
];

const benchPeriods: BenchPeriod[] = [
  {
    label: "Last 30 days",
    awards: "19,664",
    volume: "€4,994,645,396",
    tone: "bg-[#F4FBFB] border-[#D8F3F1]",
  },
  {
    label: "Last 12 months",
    awards: "368,998",
    volume: "€73,982,013,570",
    tone: "bg-slate-50 border-slate-200",
  },
  {
    label: "Last 5 years",
    awards: "1,506,535",
    volume: "€288,968,904,946",
    tone: "bg-slate-50 border-slate-200",
  },
];

const topBuyers: RankedEntity[] = [
  {
    name: "Município de Vila Real de Santo António",
    awards: "5 awards",
    volume: "€34,598,680",
    width: "100%",
  },
  {
    name: "Serviço de Utilização Comum dos Hospitais",
    awards: "17 awards",
    volume: "€26,345,891",
    width: "80%",
  },
  {
    name: "Ministério da Administração Interna",
    awards: "1 award",
    volume: "€24,670,063",
    width: "74%",
  },
];

const topCompetitors: RankedEntity[] = [
  {
    name: "REDE AMBIENTE - ENGENHARIA E SERVIÇOS S A",
    awards: "5 awards",
    volume: "€38,945,833",
    width: "100%",
  },
  {
    name: "FINE FACILITY SERVICES LDA",
    awards: "68 awards",
    volume: "€38,541,294",
    width: "92%",
  },
  {
    name: "SUMA SERVIÇOS URBANOS E MEIO AMBIENTE SA",
    awards: "47 awards",
    volume: "€18,308,562",
    width: "60%",
  },
];

function CompanyLink({ children }: { children: React.ReactNode }) {
  return <a className="cursor-pointer text-[#0FB9B1] hover:underline">{children}</a>;
}

function Sidebar({
  page,
  setPage,
  onOpenSimplifaer,
}: {
  page: Page;
  setPage: (page: Page) => void;
  onOpenSimplifaer: () => void;
}) {
  return (
    <aside className="flex w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div className="inline-flex items-center gap-3 rounded-xl bg-[#0B0F3A] px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0FB9B1] text-sm font-bold text-[#0B0F3A]">
            S
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white">Simplifae</div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 p-4" aria-label="Primary navigation">
        <button
          aria-label="Open Simplifaer"
          onClick={onOpenSimplifaer}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100"
        >
          <Sparkles className="h-4 w-4" />
          Simplifaer
        </button>

        <button
          aria-label="Open Overview"
          onClick={() => setPage("overview")}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 ${
            page === "overview" ? "bg-[#E8FBF9] text-[#0FB9B1]" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          Overview
        </button>

        <button
          aria-label="Open Discover"
          onClick={() => setPage("discover")}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 ${
            page === "discover" ? "bg-[#E8FBF9] text-[#0FB9B1]" : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Search className="h-4 w-4" />
          Discover
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100">
          <FolderKanban className="h-4 w-4" />
          My Opportunities
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100">
          <CheckSquare className="h-4 w-4" />
          Tasks
        </button>

        <div className="mt-6 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Market intelligence
        </div>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 hover:bg-slate-100">
          <BarChart3 className="h-4 w-4" />
          Benchmarks
        </button>
      </nav>
    </aside>
  );
}

function BenchSummaryCard({ period }: { period: BenchPeriod }) {
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

function BenchRankCard({
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
              <div className="h-1.5 rounded-full bg-[#0FB9B1]" style={{ width: item.width }} />
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

function ContextSparkleButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:border-[#0FB9B1] hover:text-[#0FB9B1]"
      title={label}
      aria-label={label}
    >
      <Bot className="h-4 w-4" />
    </button>
  );
}

function OverviewScreen({ onGoToDiscover }: { onGoToDiscover: () => void }) {
  const pipelineValue = "€8.6M";
  const pipelineAtRisk = "€1.2M";

  return (
    <div className="mx-auto max-w-[1500px] space-y-8">
      <div>
        <p className="text-sm text-slate-500">Overview</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">Opportunity control panel</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          A single dashboard for pipeline execution, opportunity discovery and market context.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm text-slate-500">Active opportunities</p>
          <p className="text-3xl font-semibold text-[#0B0F3A]">{pipelineValue}</p>
          <p className="mt-1 text-sm text-slate-600">{pipelineAtRisk} at deadline risk this week</p>
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
                <p className="mt-1 text-sm text-slate-500">Opportunities with deadlines approaching</p>
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
                    <p className="text-sm font-semibold text-[#0B0F3A]">Critical · deadline ≤ 3 days</p>
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
                    <p className="text-sm font-semibold text-[#0B0F3A]">High risk · deadline ≤ 5 days</p>
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
            <p className="mt-1 text-sm text-slate-500">Issues preventing proposals from progressing</p>

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
                    <p className="text-sm font-semibold text-[#0B0F3A]">Pending internal validation</p>
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
                <h2 className="text-xl font-semibold text-[#0B0F3A]">Opportunities to review</h2>
                <p className="mt-1 text-sm text-slate-500">High-fit opportunities not yet in your workspace</p>
              </div>
              <div className="rounded-full bg-[#E8FBF9] px-3 py-1 text-xs font-semibold text-[#0FB9B1]">
                Ranked by fit score
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {reviewItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#0FB9B1]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h3 className="font-medium text-[#0B0F3A]">{item.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        <span className="rounded bg-[#E8FBF9] px-2 py-1 text-[#0FB9B1]">Fit {item.fit}%</span>
                        <span className="rounded bg-slate-100 px-2 py-1">{item.value}</span>
                        <span className="rounded bg-slate-100 px-2 py-1">Deadline {item.deadline}</span>
                      </div>
                    </div>
                    <button className="rounded-xl border border-[#0FB9B1] px-4 py-2 text-[#0FB9B1]">Review</button>
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
            <h2 className="mt-1 text-2xl font-semibold text-[#0B0F3A]">Benchmarks at a glance</h2>
            <p className="mt-1 text-sm text-slate-500">Understand the market. Decide where to compete next.</p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <span>Order by:</span>
            <button className="rounded-lg bg-white px-3 py-1 font-medium text-[#0B0F3A] shadow-sm">Awards</button>
            <button className="rounded-lg px-3 py-1">Award value</button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {benchPeriods.map((period) => (
            <BenchSummaryCard key={period.label} period={period} />
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <BenchRankCard
            title="Top buyers"
            subtitle="Based on last 12 months activity"
            items={topBuyers}
            cta="Discover more prospects"
            icon={<Building2 className="h-4 w-4" />}
          />

          <BenchRankCard
            title="Top competitors"
            subtitle="Based on last 12 months activity"
            items={topCompetitors}
            cta="Discover more competitors"
            icon={<Shield className="h-4 w-4" />}
          />
        </div>
      </section>
    </div>
  );
}

function buildContextActions(page: Page, item?: SimplifaerItemContext): DrawerAction[] {
  if (item?.type === "tender") {
    return [
      { label: "Summarise this opportunity", kind: "local" },
      { label: "Extract key requirements from documents", kind: "local" },
      { label: "Evaluate fit for my company", kind: "local" },
      { label: "View competitor contracts with this buyer", kind: "external" },
      { label: "Open principal competitor page", kind: "external" },
      { label: "Do something else with Simplifaer", kind: "workspace" },
    ];
  }

  if (item?.type === "contract") {
    return [
      { label: "Estimate renewal likelihood", kind: "local" },
      { label: "Find similar expiring contracts", kind: "local" },
      { label: "View competitor contracts with this buyer", kind: "external" },
      { label: "Open principal competitor page", kind: "external" },
      { label: "Do something else with Simplifaer", kind: "workspace" },
    ];
  }

  if (page === "discover") {
    return [
      { label: "Find high-fit tenders for my company", kind: "local" },
      { label: "Search in tender documents", kind: "local" },
      { label: "Save current search as preset", kind: "local" },
      { label: "Show expiring contracts I could replace", kind: "external" },
      { label: "Do something else with Simplifaer", kind: "workspace" },
    ];
  }

  if (page === "overview") {
    return [
      { label: "What should I focus on today?", kind: "local" },
      { label: "Show my highest-risk opportunities", kind: "local" },
      { label: "Summarise pipeline blockers", kind: "local" },
      { label: "Open buyer analysis in Benchmarks", kind: "external" },
      { label: "Do something else with Simplifaer", kind: "workspace" },
    ];
  }

  return [
    { label: "Search opportunities", kind: "local" },
    { label: "Analyse buyers", kind: "local" },
    { label: "Study competitors", kind: "local" },
    { label: "Open full workspace", kind: "workspace" },
  ];
}

function SimplifaerDrawer({
  isOpen,
  onClose,
  currentPage,
  itemContext,
  onOpenWorkspace,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentPage: Page;
  itemContext?: SimplifaerItemContext | null;
  onOpenWorkspace: () => void;
}) {
  const actions = useMemo(() => buildContextActions(currentPage, itemContext ?? undefined), [currentPage, itemContext]);

  return (
    <aside
      className={`fixed right-0 top-0 z-40 h-screen w-[420px] border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Simplifaer</p>
            <h2 className="text-lg font-semibold text-[#0B0F3A]">AI Copilot</h2>
          </div>
          <button onClick={onClose} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:text-[#0FB9B1]">
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current context</p>
            <p className="mt-2 text-sm font-medium text-[#0B0F3A] capitalize">{currentPage}</p>
            <p className="mt-1 text-sm text-slate-500">
              {itemContext
                ? "Working on a selected item without leaving this screen."
                : "Suggestions below are tailored to this screen and your recent usage."}
            </p>
          </div>

          {itemContext && (
            <div className="rounded-2xl border border-[#CDEFEA] bg-[#F4FBFB] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-500">{itemContext.id}</span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-[#0FB9B1]">{itemContext.badge}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#0B0F3A]">{itemContext.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{itemContext.buyer}</p>
                </div>
                <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-[#0FB9B1]">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1">{itemContext.value}</span>
                <span className="rounded-full bg-white px-3 py-1">{itemContext.subtitle}</span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Suggested actions</p>
            <div className="mt-3 space-y-2">
              {actions.map((action) => {
                const isWorkspace = action.kind === "workspace";
                const isExternal = action.kind === "external";

                return (
                  <button
                    key={action.label}
                    onClick={isWorkspace ? onOpenWorkspace : undefined}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm ${
                      isWorkspace
                        ? "border-[#0B0F3A] bg-[#0B0F3A] text-white"
                        : "border-slate-200 bg-white text-[#0B0F3A] hover:border-[#0FB9B1]"
                    }`}
                  >
                    <span>{action.label}</span>
                    {isExternal ? (
                      <ExternalLink className="h-4 w-4" />
                    ) : isWorkspace ? (
                      <PanelRightOpen className="h-4 w-4" />
                    ) : (
                      <Sparkles className="h-4 w-4 text-[#0FB9B1]" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Recent requests</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Show similar tenders",
                "Summarise this tender",
                "Find expiring transport contracts",
              ].map((item) => (
                <button key={item} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-[#0FB9B1] hover:text-[#0FB9B1]">
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <textarea
              rows={4}
              className="w-full resize-none bg-transparent text-sm outline-none"
              placeholder={itemContext ? "Ask anything about this item…" : "Tell Simplifaer what you want to do…"}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Agent mode available</span>
              <button className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white">Send</button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function DiscoverScreen({
  discoverTab,
  setDiscoverTab,
  viewMode,
  setViewMode,
  onOpenSimplifaer,
}: {
  discoverTab: DiscoverTab;
  setDiscoverTab: (tab: DiscoverTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenSimplifaer: (context?: SimplifaerItemContext) => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState(savedFilters[0].id);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const visibleSavedFilters = showAllPresets ? savedFilters : savedFilters.slice(0, 3);

  const renderForecast = () => (
    <div className={viewMode === "cards" ? "grid gap-4 md:grid-cols-2" : "space-y-4"}>
      {forecastContracts.map((contract) => (
        <div
          key={contract.id}
          className={`rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0FB9B1] ${
            viewMode === "cards" ? "space-y-4" : "flex items-center justify-between"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">{contract.id}</span>
              <span className="rounded-full bg-amber-50 px-2 py-1 text-xs text-amber-700">Forecast</span>
            </div>
            <h3 className="font-semibold text-[#0B0F3A]">{contract.title}</h3>
            <p className="text-sm">
              <CompanyLink>{contract.buyer}</CompanyLink>
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <span>{contract.value}</span>
              <span>{contract.renewal}</span>
            </div>
          </div>

          <div className={`flex items-center gap-4 ${viewMode === "cards" ? "justify-between" : ""}`}>
            <div className="text-center">
              <div className="rounded-full bg-[#E8FBF9] px-3 py-1 text-sm font-semibold text-[#0FB9B1]">
                {contract.probability}%
              </div>
              <p className="mt-1 text-xs text-slate-500">Continuity</p>
            </div>
            <div className="flex gap-3">
              <ContextSparkleButton
                label="Open Simplifaer for this contract"
                onClick={() =>
                  onOpenSimplifaer({
                    id: contract.id,
                    title: contract.title,
                    buyer: contract.buyer,
                    value: contract.value,
                    subtitle: contract.renewal,
                    badge: `Continuity ${contract.probability}%`,
                    type: "contract",
                  })
                }
              />
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Save</button>
              <button className="rounded-xl border border-[#0FB9B1] px-4 py-2 text-sm text-[#0FB9B1]">
                Review
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActive = () => (
    <div className={viewMode === "cards" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "space-y-4"}>
      {opportunities.map((op) => (
        <div
          key={op.id}
          className={`rounded-2xl border border-slate-200 bg-white p-5 hover:border-[#0FB9B1] ${
            viewMode === "cards" ? "space-y-4" : "flex items-center justify-between"
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs text-slate-500">{op.id}</span>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">Published</span>
            </div>
            <h3 className="font-semibold text-[#0B0F3A]">{op.title}</h3>
            <p className="text-sm">
              <CompanyLink>{op.buyer}</CompanyLink>
            </p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-700">
              <span>{op.value}</span>
              <span>{op.location}</span>
              <span>Deadline {op.deadline}</span>
              <span className="text-slate-500">{op.procedure}</span>
            </div>
          </div>

          <div className={`flex items-center gap-6 ${viewMode === "cards" ? "justify-between" : ""}`}>
            <div className="text-center">
              <div className="rounded-full bg-[#E8FBF9] px-3 py-1 text-sm font-semibold text-[#0FB9B1]">
                {op.score}%
              </div>
              <p className="mt-1 text-xs text-slate-500">Fit score</p>
            </div>

            <div className="flex gap-3">
              <ContextSparkleButton
                label="Open Simplifaer for this tender"
                onClick={() =>
                  onOpenSimplifaer({
                    id: op.id,
                    title: op.title,
                    buyer: op.buyer,
                    value: op.value,
                    subtitle: `${op.location} · Deadline ${op.deadline}`,
                    badge: `Fit ${op.score}%`,
                    type: "tender",
                  })
                }
              />
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Save</button>
              <button className="rounded-xl border border-[#0FB9B1] px-4 py-2 text-sm text-[#0FB9B1]">
                Review
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1500px] space-y-6">
      <div>
        <p className="text-sm text-slate-500">Discover</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">Explore opportunities</h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0B0F3A]">Saved searches</p>
            <p className="text-xs text-slate-500">Reusable advanced searches for frequent monitoring and alerts</p>
          </div>
          <button
            onClick={() => setShowSearchPanel((current) => !current)}
            className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white"
          >
            {showSearchPanel ? "Close search" : "New search"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {visibleSavedFilters.map((filter) => {
            const active = filter.id === selectedFilter;
            return (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`rounded-2xl border p-4 text-left ${
                  active ? "border-[#0FB9B1] bg-[#E8FBF9]" : "border-slate-200"
                }`}
              >
                <p className="text-sm font-semibold text-[#0B0F3A]">{filter.name}</p>
                <p className="mt-1 text-xs text-slate-500">{filter.description}</p>
                <div className="mt-3 flex gap-2 text-xs">
                  <span className="rounded bg-white px-2 py-1">Use</span>
                  <span className="rounded bg-white px-2 py-1">Edit</span>
                  <span className="rounded bg-white px-2 py-1">Alerts</span>
                </div>
              </button>
            );
          })}
        </div>

        {savedFilters.length > 3 && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={() => setShowAllPresets((current) => !current)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-[#0B0F3A] hover:border-[#0FB9B1] hover:text-[#0FB9B1]"
            >
              {showAllPresets ? "Show less" : "View all saved searches"}
            </button>
          </div>
        )}
      </div>

      {showSearchPanel && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <input
              className="flex-1 text-sm outline-none"
              placeholder="Search tenders, buyers, CPV, locations or describe what you need…"
            />

            <button className="rounded-xl bg-[#0B0F3A] px-5 py-2 text-sm text-white">Search</button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="rounded-xl border border-[#0FB9B1] bg-[#E8FBF9] px-4 py-2 text-sm text-[#0B0F3A]"
            >
              Advanced Search
            </button>

            {["Sector", "Buyer", "Location", "Value", "Deadline", "Procedure"].map((filter) => (
              <button
                key={filter}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm hover:border-[#0FB9B1]"
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {["Published last 24h", "Updated last 24h", "Expiring soon", "Under €50K"].map((preset) => (
              <button key={preset} className="rounded-full bg-slate-100 px-3 py-1.5 hover:bg-[#E8FBF9]">
                {preset}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSearchPanel && showAdvanced && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-[#0B0F3A]">Advanced Search builder</p>
              <p className="text-xs text-slate-500">Build complex queries, then save them as presets and alerts.</p>
            </div>
            <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">~148 opportunities match this query</div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Market</p>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="CPV or sector" />
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Subsector" />
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" /> Search in tender documents
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Buyer</p>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Buyer name" />
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Buyer location" />
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option>Buyer activity</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Contract</p>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option>Procedure type</option>
              </select>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option>Contract type</option>
              </select>
              <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option>Status</option>
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Value</p>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Min value" />
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Max value" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Dates</p>
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Publication date from" />
              <input className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Deadline before" />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500">Query logic</p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                CPV = IT services AND Value &gt; €1M AND Deadline &lt; 30 days
              </div>
              <button className="rounded-xl border border-slate-200 px-3 py-2 text-sm">Add condition</button>
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button className="rounded-xl border border-slate-200 px-4 py-2 text-sm">Reset</button>
            <button className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white">Apply filters</button>
            <button className="rounded-xl border border-[#0FB9B1] px-4 py-2 text-sm text-[#0FB9B1]">Save as preset</button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["Spain", "IT services", "Value > €1M"].map((filter) => (
          <span key={filter} className="rounded-full bg-[#E8FBF9] px-3 py-1 text-xs text-[#0FB9B1]">
            {filter} ×
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-6">
          <button
            onClick={() => setDiscoverTab("active")}
            className={discoverTab === "active" ? "font-semibold text-[#0FB9B1]" : "text-slate-500"}
          >
            Active opportunities
          </button>
          <button
            onClick={() => setDiscoverTab("forecast")}
            className={discoverTab === "forecast" ? "font-semibold text-[#0FB9B1]" : "text-slate-500"}
          >
            Forecast (expiring contracts)
          </button>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500">
            {discoverTab === "active" ? "9717 opportunities" : "412 expiring contracts"}
          </span>

          <select className="rounded-lg border border-slate-200 px-2 py-1">
            <option>{discoverTab === "active" ? "Sort by Fit score" : "Sort by Continuity"}</option>
            <option>Sort by Deadline</option>
            <option>Sort by Value</option>
          </select>

          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg border px-3 py-1 ${
              viewMode === "list" ? "border-[#0FB9B1] text-[#0FB9B1]" : "border-slate-200"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("cards")}
            className={`rounded-lg border px-3 py-1 ${
              viewMode === "cards" ? "border-[#0FB9B1] text-[#0FB9B1]" : "border-slate-200"
            }`}
          >
            Cards
          </button>

          <button className="rounded-lg border border-slate-200 px-3 py-1">Export</button>
        </div>
      </div>

      {discoverTab === "active" ? renderActive() : renderForecast()}
    </div>
  );
}

function SimplifaerWorkspaceScreen() {
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <div>
        <p className="text-sm text-slate-500">Simplifaer</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">Full workspace</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Use Simplifaer as an agent to work across opportunities, buyer intelligence, competitor analysis and forecast scenarios in a dedicated workspace.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <textarea
              rows={5}
              className="w-full resize-none bg-transparent text-sm outline-none"
              placeholder="Tell Simplifaer what you want to analyse, automate or compare…"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "Analyse this buyer",
              "Find similar tenders",
              "Compare competitors",
              "Create a monitoring preset",
            ].map((item) => (
              <button key={item} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:border-[#0FB9B1] hover:text-[#0FB9B1]">
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-[#0B0F3A]">Agent actions</p>
          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl border border-slate-200 p-4">Search Discover and apply structured filters</div>
            <div className="rounded-2xl border border-slate-200 p-4">Open Benchmarks in a new tab with buyer or competitor context</div>
            <div className="rounded-2xl border border-slate-200 p-4">Create presets and alerts from the current analysis</div>
          </div>
        </section>
      </div>
    </div>
  );
}

export function BasicRenderTests() {
  return (
    <div className="hidden">
      <OverviewScreen onGoToDiscover={() => undefined} />
      <DiscoverScreen
        discoverTab="active"
        setDiscoverTab={() => undefined}
        viewMode="list"
        setViewMode={() => undefined}
        onOpenSimplifaer={() => undefined}
      />
      <DiscoverScreen
        discoverTab="forecast"
        setDiscoverTab={() => undefined}
        viewMode="cards"
        setViewMode={() => undefined}
        onOpenSimplifaer={() => undefined}
      />
      <SimplifaerWorkspaceScreen />
    </div>
  );
}

export default function OverviewPageRedesign() {
  const [page, setPage] = useState<Page>("overview");
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [simplifaerOpen, setSimplifaerOpen] = useState(false);
  const [simplifaerContext, setSimplifaerContext] = useState<SimplifaerItemContext | null>(null);

  const openSimplifaer = (context?: SimplifaerItemContext) => {
    setSimplifaerContext(context ?? null);
    setSimplifaerOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar page={page} setPage={setPage} onOpenSimplifaer={() => openSimplifaer()} />

      <main className={`flex-1 p-8 transition-all duration-300 ${simplifaerOpen ? "mr-[420px]" : ""}`}>
        {page === "overview" && <OverviewScreen onGoToDiscover={() => setPage("discover")} />}

        {page === "discover" && (
          <DiscoverScreen
            discoverTab={discoverTab}
            setDiscoverTab={setDiscoverTab}
            viewMode={viewMode}
            setViewMode={setViewMode}
            onOpenSimplifaer={openSimplifaer}
          />
        )}

        {page === "simplifaer" && <SimplifaerWorkspaceScreen />}
      </main>

      <SimplifaerDrawer
        isOpen={simplifaerOpen}
        onClose={() => setSimplifaerOpen(false)}
        currentPage={page}
        itemContext={simplifaerContext}
        onOpenWorkspace={() => {
          setPage("simplifaer");
          setSimplifaerOpen(false);
        }}
      />
    </div>
  );
}
