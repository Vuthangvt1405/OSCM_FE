"use client";

import { useSidebarContext } from "../context/SidebarContext";
import { SidebarMenuButton } from "./SidebarMenuButton";

/**
 * Client wrapper that conditionally renders SidebarMenuButton
 * based on whether the current page has a sidebar.
 */
export function SidebarMenuButtonWrapper() {
  const { hasSidebar } = useSidebarContext();

  if (!hasSidebar) {
    return null;
  }

  return <SidebarMenuButton />;
}
