"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebarContext } from "@/features/sidebar";
import { Home, Compass, Grid3X3, User, Bookmark } from "lucide-react";

// Menu items configuration
const mainMenuItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Popular", href: "/popular", icon: Compass },
  { label: "Topics", href: "/topics", icon: Grid3X3 },
];

const libraryMenuItems = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Reading List", href: "/reading-list", icon: Bookmark },
];

interface SidebarContentProps {
  collapsed?: boolean;
}

function SidebarContent({ collapsed }: SidebarContentProps) {
  const pathname = usePathname();

  const renderMenuItem = (
    item: {
      label: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    },
    isActive: boolean,
  ) => {
    const Icon = item.icon;
    return (
      <li key={item.label}>
        <Link
          href={item.href}
          prefetch={false}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "bg-slate-100 text-slate-900"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="flex h-10 items-center border-b border-slate-200 px-4">
        {!collapsed && (
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Menu
          </span>
        )}
      </div>
      <div className="flex-1 overflow-auto p-3">
        {/* Main Menu Section */}
        <ul className="space-y-1">
          {mainMenuItems.map((item) =>
            renderMenuItem(item, pathname === item.href),
          )}
        </ul>

        {/* My Library Section */}
        {!collapsed && (
          <div className="mt-6">
            <span className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              My Library
            </span>
          </div>
        )}
        <ul className="mt-2 space-y-1">
          {libraryMenuItems.map((item) =>
            renderMenuItem(item, pathname === item.href),
          )}
        </ul>
      </div>
    </div>
  );
}

export function AppSidebar() {
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile, collapsed } = useSidebarContext();

  // Mobile: Sheet drawer
  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="w-64 bg-white p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  // PC: Collapsible sidebar under header
  return (
    <aside
      className={`hidden shrink-0 flex-col bg-white transition-all duration-200 md:flex ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <SidebarContent collapsed={collapsed} />
    </aside>
  );
}

export default AppSidebar;
