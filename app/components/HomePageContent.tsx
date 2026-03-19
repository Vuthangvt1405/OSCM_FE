"use client";

import { AppSidebar } from "@/components/layout/AppSidebar";
import { DEMO_ANNOUNCEMENTS, DEMO_TOPICS } from "@/data/demo/demo";
import { useSidebarAvailability } from "@/features/sidebar";
import InfiniteFeedList from "@/features/social/components/InfiniteFeedList";
import { RightSideBar } from "@/features/social/components/RightSideBar";
import { Compass, Flame, Sparkles, TrendingUp } from "lucide-react";

const highlightItems = [
  {
    label: "Fresh stories",
    value: "Daily feed",
    icon: Sparkles,
  },
  {
    label: "Trending topics",
    value: `${DEMO_TOPICS.length}+ communities`,
    icon: TrendingUp,
  },
  {
    label: "Curated discovery",
    value: "Reader-first layout",
    icon: Compass,
  },
] as const;

export function HomePageContent() {
  useSidebarAvailability();

  return (
    <div className="flex flex-1 overflow-hidden bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_42%,#f8fafc_100%)]">
      <AppSidebar />

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col overflow-hidden px-4 pb-6 pt-6 sm:px-6 lg:px-8">
          <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="min-h-0">
              <div className="mb-4 flex items-center justify-between gap-4 px-1">
                <div>
                  <h1 className="text-md font-bold uppercase tracking-[0.18em] text-black">
                    Main feed
                  </h1>
                </div>
              </div>

              <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_20px_50px_rgba(148,163,184,0.12)] sm:p-6">
                <InfiniteFeedList pageSize={10} />
              </div>
            </section>

            <aside className="min-h-0 xl:block">
              <div className="mb-4 px-1 xl:px-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Sidebar
                </p>
              </div>

              <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(148,163,184,0.12)]">
                <RightSideBar
                  announcements={DEMO_ANNOUNCEMENTS}
                  topics={DEMO_TOPICS}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
