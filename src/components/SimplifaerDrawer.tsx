import { useMemo } from "react";
import {
  Sparkles,
  PanelRightClose,
  PanelRightOpen,
  ExternalLink,
} from "lucide-react";
import type { DrawerAction, Page, SimplifaerItemContext } from "../types/types";

function buildContextActions(
  page: Page,
  item?: SimplifaerItemContext
): DrawerAction[] {
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

export default function SimplifaerDrawer({
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
  const actions = useMemo(
    () => buildContextActions(currentPage, itemContext ?? undefined),
    [currentPage, itemContext]
  );

  return (
    <aside
      className={`shrink-0 overflow-hidden border-l border-slate-200 bg-white transition-all duration-300 ${
        isOpen ? "w-[400px] xl:w-[420px]" : "w-0 border-l-0"
      }`}
    >
      <div
        className={`flex h-screen w-[400px] flex-col xl:w-[420px] ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        } transition-opacity duration-200`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Simplifaer
            </p>
            <h2 className="text-lg font-semibold text-[#0B0F3A]">AI Copilot</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 p-2 text-slate-500 transition-colors duration-150 hover:text-[#0FB9B1]"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Current context
            </p>
            <p className="mt-2 text-sm font-medium capitalize text-[#0B0F3A]">
              {currentPage}
            </p>
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
                    <span className="rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-500">
                      {itemContext.id}
                    </span>
                    <span className="rounded-full bg-white px-2 py-1 text-xs text-[#0FB9B1]">
                      {itemContext.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#0B0F3A]">
                    {itemContext.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {itemContext.buyer}
                  </p>
                </div>
                <button className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition-colors duration-150 hover:text-[#0FB9B1]">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                <span className="rounded-full bg-white px-3 py-1">
                  {itemContext.value}
                </span>
                <span className="rounded-full bg-white px-3 py-1">
                  {itemContext.subtitle}
                </span>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Suggested actions
            </p>
            <div className="mt-3 space-y-2">
              {actions.map((action) => {
                const isWorkspace = action.kind === "workspace";
                const isExternal = action.kind === "external";

                return (
                  <button
                    key={action.label}
                    onClick={isWorkspace ? onOpenWorkspace : undefined}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-colors duration-150 ${
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Recent requests
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                "Show similar tenders",
                "Summarise this tender",
                "Find expiring transport contracts",
              ].map((item) => (
                <button
                  key={item}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs text-slate-600 transition-colors duration-150 hover:border-[#0FB9B1] hover:text-[#0FB9B1]"
                >
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
              placeholder={
                itemContext
                  ? "Ask anything about this item…"
                  : "Tell Simplifaer what you want to do…"
              }
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">Agent mode available</span>
              <button className="rounded-xl bg-[#0B0F3A] px-4 py-2 text-sm text-white">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}