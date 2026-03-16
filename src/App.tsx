import { useState } from "react";
import { Menu, X } from "lucide-react";
import Sidebar from "./components/Sidebar";
import OverviewScreen from "./components/OverviewScreen";
import DiscoverScreen from "./components/DiscoverScreen";
import SimplifaerDrawer from "./components/SimplifaerDrawer";
import TenderDetailScreen from "./components/TenderDetailScreen";
import type {
  Page,
  DiscoverTab,
  ViewMode,
  SimplifaerItemContext,
} from "./types/types";

export default function App() {
  const [page, setPage] = useState<Page>("overview");
  const [discoverTab, setDiscoverTab] = useState<DiscoverTab>("active");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [simplifaerOpen, setSimplifaerOpen] = useState(false);
  const [simplifaerContext, setSimplifaerContext] =
    useState<SimplifaerItemContext | null>(null);
  const [selectedTenderContext, setSelectedTenderContext] =
    useState<SimplifaerItemContext | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const openSimplifaer = (context?: SimplifaerItemContext) => {
    setSimplifaerContext(context ?? selectedTenderContext ?? null);
    setSimplifaerOpen(true);
  };

  const openTenderDetail = (context: SimplifaerItemContext) => {
    setSelectedTenderContext(context);
    setPage("tender");
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="hidden lg:flex">
        <Sidebar
          page={page}
          setPage={setPage}
          onOpenSimplifaer={() => openSimplifaer()}
        />
      </div>

      <div className="flex min-w-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
            >
              <Menu className="h-5 w-5" />
            </button>

            <img
              src="/simplifae_logo_v1.png"
              alt="Simplifae"
              className="h-8 w-auto object-contain"
            />

            <div className="w-10" />
          </div>

          <main className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">
            {page === "overview" && (
              <OverviewScreen onGoToDiscover={() => setPage("discover")} />
            )}

            {page === "discover" && (
              <DiscoverScreen
                discoverTab={discoverTab}
                setDiscoverTab={setDiscoverTab}
                viewMode={viewMode}
                setViewMode={setViewMode}
                onOpenSimplifaer={openSimplifaer}
                onOpenTenderDetail={openTenderDetail}
              />
            )}

            {page === "tender" && (
              <TenderDetailScreen
                context={selectedTenderContext}
                onBack={() => setPage("discover")}
                onOpenSimplifaer={openSimplifaer}
              />
            )}

            {page === "simplifaer" && (
              <div className="mx-auto max-w-[1200px]">
                <p className="text-sm text-slate-500">Simplifaer</p>
                <h1 className="text-3xl font-semibold text-[#0B0F3A]">
                  Full workspace
                </h1>
              </div>
            )}
          </main>
        </div>

        <SimplifaerDrawer
          isOpen={simplifaerOpen}
          onClose={() => setSimplifaerOpen(false)}
          currentPage={page}
          itemContext={simplifaerContext ?? selectedTenderContext}
          onOpenWorkspace={() => setPage("simplifaer")}
        />
      </div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation overlay"
          />

          <div className="absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <img
                src="/simplifae_logo_v1.png"
                alt="Simplifae"
                className="h-10 w-auto object-contain"
              />

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100%-73px)]">
              <Sidebar
                page={page}
                setPage={(nextPage) => {
                  setPage(nextPage);
                  setMobileMenuOpen(false);
                }}
                onOpenSimplifaer={() => {
                  openSimplifaer();
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
