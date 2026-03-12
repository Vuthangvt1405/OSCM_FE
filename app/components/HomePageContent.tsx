"use client";

import { useSidebarAvailability } from "@/features/sidebar";
import { RightSideBar } from "@/features/social/components/RightSideBar";
import { DEMO_ANNOUNCEMENTS, DEMO_TOPICS } from "@/data/demo/demo";
import InfiniteFeedList from "@/features/social/components/InfiniteFeedList";
import { AppSidebar } from "@/components/layout/AppSidebar";

export function HomePageContent() {
  // Declare that this page has a sidebar (enables sidebar menu button in header)
  useSidebarAvailability();

  return (
    <div className="flex flex-1 overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        <div className="mx-auto h-full w-full max-w-6xl overflow-hidden px-4">
          <div className="box-border h-full py-8">
            <div className="grid h-full min-h-0 gap-6 lg:grid-cols-[1fr_320px]">
              <section className="h-full min-h-0 rounded-xl">
                <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto rounded-lg bg-white p-6">
                  <InfiniteFeedList pageSize={10} />
                </div>
              </section>

              <aside className="h-full min-h-0 rounded-xl border border-slate-200 bg-white p-0 shadow-sm">
                <div className="scrollbar-hidden h-full min-h-0 overflow-y-auto p-6">
                  <RightSideBar
                    announcements={DEMO_ANNOUNCEMENTS}
                    topics={DEMO_TOPICS}
                  />
                </div>
              </aside>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
