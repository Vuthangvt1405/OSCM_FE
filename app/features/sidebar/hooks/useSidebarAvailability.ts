"use client";

import * as React from "react";
import { useSidebarContext } from "../context/SidebarContext";

/**
 * Hook to declare that the current page has a sidebar.
 * Call this in pages that render AppSidebar.
 *
 * @example
 * ```tsx
 * function HomePage() {
 *   useSidebarAvailability();
 *   return (
 *     <SiteHeader>
 *       <AppSidebar />
 *       <main>...</main>
 *     </SiteHeader>
 *   );
 * }
 * ```
 */
export function useSidebarAvailability() {
  const { setHasSidebar } = useSidebarContext();

  React.useEffect(() => {
    setHasSidebar(true);

    // Cleanup: reset when component unmounts
    return () => {
      setHasSidebar(false);
    };
  }, [setHasSidebar]);
}
