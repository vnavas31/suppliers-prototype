import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Heart,
  LayoutGrid,
  List,
  Download,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  ThumbsDown,
  Sparkles,
} from "lucide-react";
import type {
  DiscoverTab,
  ViewMode,
  SimplifaerItemContext,
  Opportunity,
  MinorContract,
  ForecastContract,
  DesertedTender,
  AnnualPurchasingPlan,
  DynamicPurchasingSystem,
} from "../types/types";

import {
  opportunities,
  minorContracts,
  forecastContracts,
  desertedTenders,
  annualPurchasingPlans,
  dynamicPurchasingSystems,
  savedFilters,
} from "../data/mockData";

type SortOption =
  | "fitScore"
  | "deadline"
  | "basePrice"
  | "publicationDate";

type InteractionState = {
  seen: boolean;
  dismissed: boolean;
};

type DiscoverItem =
  | Opportunity
  | MinorContract
  | ForecastContract
  | DesertedTender
  | AnnualPurchasingPlan
  | DynamicPurchasingSystem;

function CompanyLink({ children }: { children: ReactNode }) {
  return (
    <a className="cursor-pointer text-[#0FB9B1] hover:underline">{children}</a>
  );
}


function parseDisplayDate(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getDaysLeftLabel(value: string) {
  const parsed = parseDisplayDate(value);
  if (!parsed) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const diffDays = Math.ceil((target.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return 'Closed';
  if (diffDays == 0) return 'Last day';
  if (diffDays == 1) return '1 day left';
  return `${diffDays} days left`;
}

function trimLocation(value: string) {
  return value.split(',')[0].trim();
}

function MetaStrip({ items, seen }: { items: string[]; seen: boolean }) {
  return (
    <div className={getMetaTextClasses(seen)}>
      {items.filter(Boolean).map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center">
          {index > 0 && <span className="mx-2 text-slate-300">|</span>}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

function getScoreTone(score: number) {
  if (score >= 90) {
    return {
      badge: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
    };
  }

  if (score >= 80) {
    return {
      badge: "bg-lime-100 text-lime-700",
      dot: "bg-lime-500",
    };
  }

  if (score >= 70) {
    return {
      badge: "bg-amber-100 text-amber-700",
      dot: "bg-amber-500",
    };
  }

  if (score >= 60) {
    return {
      badge: "bg-orange-100 text-orange-700",
      dot: "bg-orange-500",
    };
  }

  return {
    badge: "bg-rose-100 text-rose-700",
    dot: "bg-rose-500",
  };
}

function MetricBadge({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const tone = getScoreTone(score);

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white px-4 py-3 text-right shadow-sm ${tone.badge}`}>
      <div className="flex items-center justify-end gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${tone.dot}`} />
        <span className="text-lg font-bold leading-none">{score}%</span>
      </div>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-80">{label}</p>
    </div>
  );
}

function StatusBadge({ seen }: { seen: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
        seen
          ? "border-slate-200 bg-slate-50 text-slate-500"
          : "border-[#CBEFEB] bg-[#F3FCFB] text-[#0B0F3A]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          seen ? "bg-slate-400" : "bg-[#0FB9B1]"
        }`}
      />
      {seen ? "Seen" : "Unseen"}
    </span>
  );
}

function getCardContainerClasses(seen: boolean, viewMode: ViewMode) {
  const layout =
    viewMode === "cards"
      ? "flex h-full flex-col"
      : "flex w-full flex-col";

  const emphasis = seen
    ? "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
    : "border-[#6EDFD6] bg-[#F7FEFD] shadow-[0_0_0_1px_rgba(15,185,177,0.10),0_8px_30px_rgba(15,185,177,0.10)] hover:border-[#0FB9B1] hover:bg-[#F2FEFC]";

  return `group relative w-full overflow-hidden rounded-2xl border p-5 transition-all duration-150 ${layout} ${emphasis}`;
}

function getTitleClasses(seen: boolean) {
  return seen
    ? "text-lg font-semibold text-slate-800 transition-colors group-hover:text-[#0B0F3A]"
    : "text-xl font-semibold text-[#0B0F3A]";
}

function getSummaryClasses(seen: boolean) {
  return seen
    ? "text-sm leading-6 text-slate-500"
    : "text-sm leading-6 text-slate-700";
}

function getMetaTextClasses(seen: boolean) {
  return seen
    ? "flex flex-wrap items-center gap-y-2 text-sm text-slate-400"
    : "flex flex-wrap items-center gap-y-2 text-sm text-slate-600";
}

function IconActionButton({
  title,
  ariaLabel,
  onClick,
  children,
  accent = "default",
  label,
}: {
  title: string;
  ariaLabel: string;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: ReactNode;
  accent?: "default" | "ai" | "negative" | "favourite";
  label?: string;
}) {
  const accentClasses =
    accent === "ai"
      ? "hover:border-[#0FB9B1] hover:bg-[#EAFBFA] hover:text-[#0FB9B1]"
      : accent === "negative"
        ? "hover:border-slate-400 hover:bg-slate-100 hover:text-slate-700"
        : accent === "favourite"
          ? "hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
          : "hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600";

  return (
    <button
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-slate-500 transition-colors duration-150 ${label ? 'w-auto' : 'w-10'} ${accentClasses}`}
    >
      {children}
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

function CardFooter({
  seen,
  viewMode,
  meta,
  onOpenItem,
  onOpenSimplifaer,
  onToggleSeen,
  onDismiss,
}: {
  seen: boolean;
  viewMode: ViewMode;
  meta: ReactNode;
  onOpenItem: () => void;
  onOpenSimplifaer: () => void;
  onToggleSeen: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      className={`mt-4 border-t pt-4 ${
        seen ? "border-slate-100" : "border-[#D8F4F1]"
      }`}
    >
      <div
        className={
          viewMode === "cards"
            ? "space-y-4"
            : "flex items-end justify-between gap-6"
        }
      >
        <div className="min-w-0 flex-1">
          <div className={getMetaTextClasses(seen)}>{meta}</div>
        </div>

        <div
          className={
            viewMode === "cards"
              ? "flex flex-wrap items-center justify-end gap-4"
              : "flex shrink-0 items-center gap-4"
          }
        >
          <div className="flex items-center gap-2">
            <IconActionButton
              title="Open in Simplifaer AI"
              ariaLabel="Open in Simplifaer AI"
              onClick={(event) => {
                event.stopPropagation();
                onOpenSimplifaer();
              }}
              accent="ai"
              label={viewMode === "list" ? "AI" : undefined}
            >
              <Sparkles className="h-4 w-4" />
            </IconActionButton>

            <IconActionButton
              title={seen ? "Mark as unseen" : "Mark as seen"}
              ariaLabel={seen ? "Mark as unseen" : "Mark as seen"}
              onClick={(event) => {
                event.stopPropagation();
                onToggleSeen();
              }}
              label={viewMode === "list" ? (seen ? "Unsee" : "Seen") : undefined}
            >
              {seen ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </IconActionButton>

            <IconActionButton
              title="Save opportunity"
              ariaLabel="Save opportunity"
              onClick={(event) => {
                event.stopPropagation();
              }}
              accent="favourite"
              label={viewMode === "list" ? "Save" : undefined}
            >
              <Heart className="h-4 w-4" />
            </IconActionButton>

            <IconActionButton
              title="Don't suggest again"
              ariaLabel="Don't suggest again"
              onClick={(event) => {
                event.stopPropagation();
                onDismiss();
              }}
              accent="negative"
              label={viewMode === "list" ? "Hide" : undefined}
            >
              <ThumbsDown className="h-4 w-4" />
            </IconActionButton>
          </div>
        </div>
      </div>

      <button
        onClick={onOpenItem}
        className="sr-only"
        aria-label="Open opportunity"
      >
        Open
      </button>
    </div>
  );
}

function ToolbarViewButton({
  active = false,
  ariaLabel,
  title,
  onClick,
  children,
}: {
  active?: boolean;
  ariaLabel: string;
  title: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={ariaLabel}
      title={title}
      onClick={onClick}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors duration-150 ${
        active
          ? "border-slate-300 bg-slate-100 text-[#0B0F3A]"
          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B0F3A]"
      }`}
    >
      {children}
    </button>
  );
}

function getSortLabel(option: SortOption) {
  switch (option) {
    case "fitScore":
      return "Fit score";
    case "deadline":
      return "Deadline to submit offer";
    case "basePrice":
      return "Base price";
    case "publicationDate":
      return "Publication date";
    default:
      return "Fit score";
  }
}

function getAvailableSortOptions(tab: DiscoverTab): SortOption[] {
  const baseOptions: SortOption[] = [
    "fitScore",
    "basePrice",
    "publicationDate",
  ];

  if (tab === "active" || tab === "minor") {
    return ["fitScore", "deadline", "basePrice", "publicationDate"];
  }

  return baseOptions;
}

function EmptyTabState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm font-medium text-[#0B0F3A]">
        No {label.toLowerCase()} available right now
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Dismissed items are hidden from the list.
      </p>
    </div>
  );
}

function buildInitialInteractionState(items: DiscoverItem[]) {
  return items.reduce<Record<string, InteractionState>>((acc, item) => {
    acc[item.id] = {
      seen: item.isSeen ?? false,
      dismissed: item.isDismissed ?? false,
    };
    return acc;
  }, {});
}

export default function DiscoverScreen({
  discoverTab,
  setDiscoverTab,
  viewMode,
  setViewMode,
  onOpenSimplifaer,
  onOpenTenderDetail,
}: {
  discoverTab: DiscoverTab;
  setDiscoverTab: (tab: DiscoverTab) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onOpenSimplifaer: (context?: SimplifaerItemContext) => void;
  onOpenTenderDetail: (context: SimplifaerItemContext) => void;
}) {
  const [selectedFilter, setSelectedFilter] = useState(savedFilters[0].id);
  const [showSearchPanel, setShowSearchPanel] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAllPresets, setShowAllPresets] = useState(false);
  const [selectedSort, setSelectedSort] = useState<SortOption>("fitScore");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const [itemState, setItemState] = useState<Record<string, InteractionState>>(
    () =>
      buildInitialInteractionState([
        ...opportunities,
        ...minorContracts,
        ...forecastContracts,
        ...desertedTenders,
        ...annualPurchasingPlans,
        ...dynamicPurchasingSystems,
      ])
  );

  const sortMenuRef = useRef<HTMLDivElement | null>(null);

  const visibleSavedFilters = showAllPresets
    ? savedFilters
    : savedFilters.slice(0, 3);

  const availableSortOptions = getAvailableSortOptions(discoverTab);

  useEffect(() => {
    if (!availableSortOptions.includes(selectedSort)) {
      setSelectedSort("fitScore");
    }
  }, [discoverTab, selectedSort, availableSortOptions]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(event.target as Node)
      ) {
        setShowSortMenu(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getInteraction = (id: string): InteractionState =>
    itemState[id] ?? { seen: false, dismissed: false };

  const setSeen = (id: string, value: boolean) => {
    setItemState((current) => ({
      ...current,
      [id]: {
        ...getInteraction(id),
        seen: value,
      },
    }));
  };

  const dismissItem = (id: string) => {
    setItemState((current) => ({
      ...current,
      [id]: {
        ...getInteraction(id),
        dismissed: true,
      },
    }));
  };

  const visibleOpportunities = useMemo(
    () => opportunities.filter((item) => !getInteraction(item.id).dismissed),
    [itemState]
  );

  const visibleMinorContracts = useMemo(
    () => minorContracts.filter((item) => !getInteraction(item.id).dismissed),
    [itemState]
  );

  const visibleForecastContracts = useMemo(
    () => forecastContracts.filter((item) => !getInteraction(item.id).dismissed),
    [itemState]
  );

  const visibleDesertedTenders = useMemo(
    () => desertedTenders.filter((item) => !getInteraction(item.id).dismissed),
    [itemState]
  );

  const visibleAnnualPlans = useMemo(
    () =>
      annualPurchasingPlans.filter((item) => !getInteraction(item.id).dismissed),
    [itemState]
  );

  const visibleDps = useMemo(
    () =>
      dynamicPurchasingSystems.filter(
        (item) => !getInteraction(item.id).dismissed
      ),
    [itemState]
  );

  const activeCount = visibleOpportunities.length;
  const minorCount = visibleMinorContracts.length;
  const expiringCount = visibleForecastContracts.length;
  const desertedCount = visibleDesertedTenders.length;
  const plansCount = visibleAnnualPlans.length;
  const dpsCount = visibleDps.length;

  const openTender = (id: string, context: SimplifaerItemContext) => {
    setSeen(id, true);
    onOpenTenderDetail(context);
  };

  const renderCardShell = ({
    id,
    seen,
    badge,
    title,
    buyer,
    summary,
    score,
    scoreLabel,
    secondaryMetric,
    footer,
    onOpen,
  }: {
    id: string;
    seen: boolean;
    badge: ReactNode;
    title: string;
    buyer: string;
    summary: string;
    score: number;
    scoreLabel: string;
    secondaryMetric?: { score: number; label: string };
    footer: ReactNode;
    onOpen: () => void;
  }) => (
    <button
      key={id}
      type="button"
      onClick={onOpen}
      className={`${getCardContainerClasses(
        seen,
        viewMode
      )} text-left outline-none focus-visible:ring-2 focus-visible:ring-[#0FB9B1]`}
    >
      {!seen && (
        <div className="absolute inset-x-0 top-0 h-[3px] bg-[#0FB9B1]" />
      )}

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {badge}
            <StatusBadge seen={seen} />
          </div>

          <div className="shrink-0">
            <div className="flex items-start gap-2">
              {secondaryMetric && (
                <MetricBadge
                  score={secondaryMetric.score}
                  label={secondaryMetric.label}
                />
              )}
              <MetricBadge score={score} label={scoreLabel} />
            </div>
          </div>
        </div>

        <h3 className={getTitleClasses(seen)}>{title}</h3>

        <p className="text-sm">
          <CompanyLink>{buyer}</CompanyLink>
        </p>

        <p className={`${getSummaryClasses(seen)} line-clamp-2`}>{summary}</p>
      </div>

      {footer}
    </button>
  );

  const renderActive = () => {
    if (!visibleOpportunities.length) {
      return <EmptyTabState label="Tenders" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleOpportunities.map((op) => {
          const interaction = getInteraction(op.id);
          const context = {
            id: op.id,
            title: op.title,
            buyer: op.buyer,
            value: op.value,
            subtitle: `${op.location} · Deadline ${op.deadline}`,
            badge: `Fit ${op.score}%`,
            type: "tender" as const,
          };

          return renderCardShell({
            id: op.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {op.id}
                </span>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-[11px] font-medium text-blue-700">
                  Active tender
                </span>
              </>
            ),
            title: op.title,
            buyer: op.buyer,
            summary: op.summary,
            score: op.score,
            scoreLabel: "Fit score",
            onOpen: () => openTender(op.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      op.value,
                      trimLocation(op.location),
                      `Deadline ${op.deadline}`,
                      op.procedure,
                      ...(op.lots && op.lots > 1 ? [`${op.lots} lots`] : []),
                      ...(getDaysLeftLabel(op.deadline) ? [getDaysLeftLabel(op.deadline)!] : []),
                    ]}
                  />
                }
                onOpenItem={() => openTender(op.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(op.id, !interaction.seen)}
                onDismiss={() => dismissItem(op.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderMinorContracts = () => {
    if (!visibleMinorContracts.length) {
      return <EmptyTabState label="Minor contracts" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleMinorContracts.map((contract) => {
          const interaction = getInteraction(contract.id);
          const context = {
            id: contract.id,
            title: contract.title,
            buyer: contract.buyer,
            value: contract.estimatedValue,
            subtitle: `${contract.location} · Published ${contract.publicationDate}`,
            badge: `Fit ${contract.score}%`,
            type: "contract" as const,
          };

          return renderCardShell({
            id: contract.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {contract.id}
                </span>
                <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-1 text-[11px] font-medium text-orange-700">
                  Minor contract
                </span>
              </>
            ),
            title: contract.title,
            buyer: contract.buyer,
            summary: contract.summary,
            score: contract.score,
            scoreLabel: "Fit score",
            onOpen: () => openTender(contract.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      contract.estimatedValue,
                      trimLocation(contract.location),
                      `Published ${contract.publicationDate}`,
                      contract.category,
                      ...(contract.lots && contract.lots > 1 ? [`${contract.lots} lots`] : []),
                    ]}
                  />
                }
                onOpenItem={() => openTender(contract.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(contract.id, !interaction.seen)}
                onDismiss={() => dismissItem(contract.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderExpiring = () => {
    if (!visibleForecastContracts.length) {
      return <EmptyTabState label="Expiring contracts" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleForecastContracts.map((contract) => {
          const interaction = getInteraction(contract.id);
          const context = {
            id: contract.id,
            title: contract.title,
            buyer: contract.buyer,
            value: contract.value,
            subtitle: `${contract.location} · Ends ${contract.contractEnd}`,
            badge: `Fit ${contract.score}% · Continuity ${contract.probability}%`,
            type: "contract" as const,
          };

          return renderCardShell({
            id: contract.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {contract.id}
                </span>
                <span className="rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                  Expiring contract
                </span>
              </>
            ),
            title: contract.title,
            buyer: contract.buyer,
            summary: contract.summary,
            score: contract.score,
            scoreLabel: "Fit score",
            secondaryMetric: {
              score: contract.probability,
              label: "Continuity probability",
            },
            onOpen: () => openTender(contract.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      contract.value,
                      trimLocation(contract.location),
                      `Ends ${contract.contractEnd}`,
                      contract.category,
                      ...(contract.lots && contract.lots > 1 ? [`${contract.lots} lots`] : []),
                    ]}
                  />
                }
                onOpenItem={() => openTender(contract.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(contract.id, !interaction.seen)}
                onDismiss={() => dismissItem(contract.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderDeserted = () => {
    if (!visibleDesertedTenders.length) {
      return <EmptyTabState label="Deserted tenders" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleDesertedTenders.map((tender) => {
          const interaction = getInteraction(tender.id);
          const context = {
            id: tender.id,
            title: tender.title,
            buyer: tender.buyer,
            value: tender.referenceValue,
            subtitle: `${tender.location} · Previous deadline ${tender.lastDeadline}`,
            badge: `Fit ${tender.score}%`,
            type: "tender" as const,
          };

          return renderCardShell({
            id: tender.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {tender.id}
                </span>
                <span className="rounded-full border border-rose-100 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700">
                  Deserted tender
                </span>
              </>
            ),
            title: tender.title,
            buyer: tender.buyer,
            summary: `${tender.summary} Likely cause: ${tender.reasonHint}`,
            score: tender.score,
            scoreLabel: "Fit score",
            onOpen: () => openTender(tender.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      tender.referenceValue,
                      trimLocation(tender.location),
                      tender.procedure,
                      `Previous deadline ${tender.lastDeadline}`,
                      ...(tender.lots && tender.lots > 1 ? [`${tender.lots} lots`] : []),
                    ]}
                  />
                }
                onOpenItem={() => openTender(tender.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(tender.id, !interaction.seen)}
                onDismiss={() => dismissItem(tender.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderPlans = () => {
    if (!visibleAnnualPlans.length) {
      return <EmptyTabState label="Annual plans" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleAnnualPlans.map((plan) => {
          const interaction = getInteraction(plan.id);
          const context = {
            id: plan.id,
            title: plan.title,
            buyer: plan.buyer,
            value: plan.estimatedValue,
            subtitle: `${plan.location} · Expected publication ${plan.expectedPublication}`,
            badge: `Fit ${plan.score}%`,
            type: "tender" as const,
          };

          return renderCardShell({
            id: plan.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {plan.id}
                </span>
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700">
                  Annual purchasing plan
                </span>
              </>
            ),
            title: plan.title,
            buyer: plan.buyer,
            summary: plan.summary,
            score: plan.score,
            scoreLabel: "Fit score",
            onOpen: () => openTender(plan.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      plan.estimatedValue,
                      trimLocation(plan.location),
                      `Expected publication ${plan.expectedPublication}`,
                      plan.category,
                    ]}
                  />
                }
                onOpenItem={() => openTender(plan.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(plan.id, !interaction.seen)}
                onDismiss={() => dismissItem(plan.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderDPS = () => {
    if (!visibleDps.length) {
      return <EmptyTabState label="Dynamic systems" />;
    }

    return (
      <div
        className={
          viewMode === "cards"
            ? "grid w-full gap-4 md:grid-cols-2 xl:grid-cols-3"
            : "w-full space-y-5"
        }
      >
        {visibleDps.map((dps) => {
          const interaction = getInteraction(dps.id);
          const context = {
            id: dps.id,
            title: dps.title,
            buyer: dps.buyer,
            value: dps.estimatedValue,
            subtitle: `${dps.location} · Expires ${dps.expiry}`,
            badge: `Fit ${dps.score}%`,
            type: "contract" as const,
          };

          return renderCardShell({
            id: dps.id,
            seen: interaction.seen,
            badge: (
              <>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-500">
                  {dps.id}
                </span>
                <span className="rounded-full border border-violet-100 bg-violet-50 px-2 py-1 text-[11px] font-medium text-violet-700">
                  DPS
                </span>
              </>
            ),
            title: dps.title,
            buyer: dps.buyer,
            summary: dps.summary,
            score: dps.score,
            scoreLabel: "Fit score",
            onOpen: () => openTender(dps.id, context),
            footer: (
              <CardFooter
                seen={interaction.seen}
                viewMode={viewMode}
                meta={
                  <MetaStrip
                    seen={interaction.seen}
                    items={[
                      dps.estimatedValue,
                      trimLocation(dps.location),
                      dps.category,
                      `Expires ${dps.expiry}`,
                      ...(dps.lots && dps.lots > 1 ? [`${dps.lots} lots`] : []),
                    ]}
                  />
                }
                onOpenItem={() => openTender(dps.id, context)}
                onOpenSimplifaer={() => onOpenSimplifaer(context)}
                onToggleSeen={() => setSeen(dps.id, !interaction.seen)}
                onDismiss={() => dismissItem(dps.id)}
              />
            ),
          });
        })}
      </div>
    );
  };

  const renderContent = () => {
    switch (discoverTab) {
      case "active":
        return renderActive();
      case "minor":
        return renderMinorContracts();
      case "expiring":
        return renderExpiring();
      case "deserted":
        return renderDeserted();
      case "plans":
        return renderPlans();
      case "dps":
        return renderDPS();
      default:
        return renderActive();
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <p className="text-sm text-slate-500">Discover</p>
        <h1 className="text-3xl font-semibold text-[#0B0F3A]">
          Explore opportunities
        </h1>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-[#FCFDFD] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#0B0F3A]">
              Saved searches
            </p>
            <p className="text-xs text-slate-500">
              Reusable advanced searches for frequent monitoring and alerts
            </p>
          </div>

          <button
            onClick={() => {
              setShowSearchPanel((current) => !current);
              if (showSearchPanel) {
                setShowAdvanced(false);
              }
            }}
            className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white transition-colors duration-150 hover:opacity-95"
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
                className={`rounded-2xl border p-4 text-left transition-colors duration-150 ${
                  active
                    ? "border-[#0FB9B1] bg-[#E8FBF9]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <p className="text-sm font-semibold text-[#0B0F3A]">
                  {filter.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {filter.description}
                </p>

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
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm text-[#0B0F3A] transition-colors duration-150 hover:border-[#0FB9B1] hover:text-[#0FB9B1]"
            >
              {showAllPresets ? "Show less" : "View all saved searches"}
            </button>
          </div>
        )}

        {showSearchPanel && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <input
                className="flex-1 bg-transparent text-sm outline-none"
                placeholder="Search tenders, buyers, CPV, locations or describe what you need…"
              />
              <button className="rounded-xl bg-[#0B0F3A] px-5 py-2 text-sm text-white">
                Search
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowAdvanced((current) => !current)}
                className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
                  showAdvanced
                    ? "border border-[#0FB9B1] bg-[#E8FBF9] text-[#0B0F3A]"
                    : "border border-slate-200 bg-white text-[#0B0F3A] hover:border-[#0FB9B1]"
                }`}
              >
                Advanced Search
              </button>

              {[
                "Sector",
                "Buyer",
                "Location",
                "Value",
                "Deadline",
                "Procedure",
              ].map((filter) => (
                <button
                  key={filter}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm transition-colors duration-150 hover:border-[#0FB9B1]"
                >
                  {filter}
                </button>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {[
                "Published last 24h",
                "Updated last 24h",
                "Expiring soon",
                "Under €50K",
              ].map((preset) => (
                <button
                  key={preset}
                  className="rounded-full bg-white px-3 py-1.5 text-slate-600 transition-colors duration-150 hover:bg-[#E8FBF9]"
                >
                  {preset}
                </button>
              ))}
            </div>

            {showAdvanced && (
              <div className="mt-5 border-t border-slate-300 pt-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#0B0F3A]">
                      Advanced Search builder
                    </p>
                    <p className="text-xs text-slate-500">
                      Build complex queries, then save them as presets and
                      alerts.
                    </p>
                  </div>

                  <div className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs text-slate-600">
                    ~148 opportunities match this query
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Market
                    </p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="CPV or sector"
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="Subsector"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Buyer
                    </p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="Buyer name"
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="Buyer geography"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-500">
                      Commercial
                    </p>
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="Minimum value"
                    />
                    <input
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                      placeholder="Maximum value"
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                    placeholder="Deadline before"
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                    placeholder="Procedure"
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                    placeholder="Keywords in documents"
                  />
                  <input
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm outline-none transition-colors duration-150 placeholder:text-slate-400 focus:border-[#0FB9B1]"
                    placeholder="Exclusions"
                  />
                </div>

                <div className="mt-4 flex justify-between">
                  <button className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-[#0B0F3A] shadow-sm hover:border-slate-400">
                    Save as preset
                  </button>
                  <button className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white">
                    Apply advanced search
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDiscoverTab("active")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "active"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Tenders ({activeCount})
          </button>

          <button
            onClick={() => setDiscoverTab("minor")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "minor"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Minor contracts ({minorCount})
          </button>

          <button
            onClick={() => setDiscoverTab("expiring")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "expiring"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Expiring contracts ({expiringCount})
          </button>

          <button
            onClick={() => setDiscoverTab("deserted")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "deserted"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Deserted ({desertedCount})
          </button>

          <button
            onClick={() => setDiscoverTab("plans")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "plans"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Annual plans ({plansCount})
          </button>

          <button
            onClick={() => setDiscoverTab("dps")}
            className={`rounded-xl px-4 py-2 text-sm transition-colors duration-150 ${
              discoverTab === "dps"
                ? "bg-[#0B0F3A] text-white"
                : "border border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            Dynamic systems ({dpsCount})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-1">
            <ToolbarViewButton
              ariaLabel="List view"
              title="List view"
              active={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </ToolbarViewButton>

            <ToolbarViewButton
              ariaLabel="Card view"
              title="Card view"
              active={viewMode === "cards"}
              onClick={() => setViewMode("cards")}
            >
              <LayoutGrid className="h-4 w-4" />
            </ToolbarViewButton>
          </div>

          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setShowSortMenu((current) => !current)}
              className="inline-flex h-12 min-w-[300px] items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-600 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="shrink-0 text-slate-500">Sort by:</span>
                <span className="truncate font-medium text-[#0B0F3A]">
                  {getSortLabel(selectedSort)}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-14 z-20 min-w-[260px] rounded-2xl border border-slate-200 bg-white p-2 shadow-lg">
                {availableSortOptions.map((option) => {
                  const isSelected = selectedSort === option;

                  return (
                    <button
                      key={option}
                      onClick={() => {
                        setSelectedSort(option);
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors duration-150 ${
                        isSelected
                          ? "bg-slate-100 text-[#0B0F3A]"
                          : "text-slate-600 hover:bg-slate-50 hover:text-[#0B0F3A]"
                      }`}
                    >
                      <span>{getSortLabel(option)}</span>
                      {isSelected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <button
            aria-label="Download results"
            title="Download results"
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-[#0B0F3A]"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}