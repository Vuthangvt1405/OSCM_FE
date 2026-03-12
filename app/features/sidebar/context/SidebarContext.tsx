"use client";

import * as React from "react";

// Context type definition
export type SidebarContextType = {
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  /** Whether the current page has a sidebar - controls button visibility */
  hasSidebar: boolean;
  setHasSidebar: (has: boolean) => void;
};

// Context creation with null default
const SidebarContext = React.createContext<SidebarContextType | null>(null);

/**
 * Hook to access sidebar context.
 * Throws error if used outside SidebarProvider.
 */
export function useSidebarContext(): SidebarContextType {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
}

// Provider component
export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [openMobile, setOpenMobile] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);
  const [hasSidebar, setHasSidebar] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  }, []);

  const value = React.useMemo(
    () => ({
      openMobile,
      setOpenMobile,
      collapsed,
      setCollapsed,
      toggleSidebar,
      hasSidebar,
      setHasSidebar,
    }),
    [openMobile, collapsed, toggleSidebar, hasSidebar],
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

// Export context for custom hooks
export { SidebarContext };
