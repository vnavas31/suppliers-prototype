import {
  LayoutDashboard,
  Search,
  FolderKanban,
  CheckSquare,
  BarChart3,
  Sparkles,
  Briefcase,
  Folder,
  Building2,
  Gauge,
} from "lucide-react";
import type { Page } from "../types/types";

export default function Sidebar({
  page,
  setPage,
  onOpenSimplifaer,
}: {
  page: Page;
  setPage: (page: Page) => void;
  onOpenSimplifaer: () => void;
}) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <button
          onClick={() => setPage("overview")}
          aria-label="Go to Overview"
          className="flex items-center transition-opacity hover:opacity-90"
        >
          <img
            src="/simplifae_logo_v1.png"
            alt="Simplifae"
            className="h-12 w-auto object-contain"
          />
        </button>
      </div>

      <nav className="flex-1 space-y-1 p-4" aria-label="Primary navigation">
        <button
          aria-label="Open Simplifaer"
          onClick={onOpenSimplifaer}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100"
        >
          <Sparkles className="h-4 w-4" />
          <span>Simplifaer</span>
        </button>

        <button
          aria-label="Open Overview"
          onClick={() => setPage("overview")}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
            page === "overview"
              ? "bg-[#E8FBF9] text-[#0FB9B1]"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <LayoutDashboard className="h-4 w-4" />
          <span>Overview</span>
        </button>

        <button
          aria-label="Open Discover"
          onClick={() => setPage("discover")}
          className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
            page === "discover"
              ? "bg-[#E8FBF9] text-[#0FB9B1]"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          <Search className="h-4 w-4" />
          <span>Discover</span>
        </button>

        <div className="mt-6 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Workspace
        </div>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <FolderKanban className="h-4 w-4" />
          <span>My Opportunities</span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <CheckSquare className="h-4 w-4" />
          <span>Task Manager</span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <Briefcase className="h-4 w-4" />
          <span>My Contracts</span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <Folder className="h-4 w-4" />
          <span>My Documents</span>
        </button>

        <div className="mt-6 px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Market intelligence
        </div>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <BarChart3 className="h-4 w-4" />
          <span>Market Analysis</span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <Building2 className="h-4 w-4" />
          <span>Followed Companies</span>
        </button>

        <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-slate-700 transition-colors hover:bg-slate-100">
          <Gauge className="h-4 w-4" />
          <span>My Performance</span>
        </button>
      </nav>
    </aside>
  );
}