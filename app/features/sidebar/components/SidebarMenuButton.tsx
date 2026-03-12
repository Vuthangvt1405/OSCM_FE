"use client";

import * as React from "react";
import { List, PanelLeft, PanelLeftClose } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSidebarContext } from "../context/SidebarContext";

export function SidebarMenuButton() {
  const isMobile = useIsMobile();
  const { openMobile, setOpenMobile, collapsed, setCollapsed } =
    useSidebarContext();

  const handleClick = () => {
    if (isMobile) {
      setOpenMobile(!openMobile);
    } else {
      setCollapsed(!collapsed);
    }
  };

  // Icon: Mobile shows List (burger), PC shows PanelLeft/PanelLeftClose based on state
  const Icon = isMobile ? List : collapsed ? PanelLeft : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 transition hover:bg-slate-100"
      aria-label={
        isMobile
          ? "Toggle menu"
          : collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
      }
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

export default SidebarMenuButton;
