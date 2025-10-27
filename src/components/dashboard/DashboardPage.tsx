import React, { useState, useCallback } from "react";
import { Header } from "./Header";
import { DashboardContent } from "./DashboardContent";
import type { SummaryVM } from "@/types";

/**
 * DashboardPage is a wrapper component that manages state and coordination
 * between Header (settings, logout) and DashboardContent (summary display).
 *
 * Handles:
 * - Summary data state for display in Header
 * - Refresh trigger from settings save
 * - Loading state propagation to Header
 */
export function DashboardPage(): React.ReactNode {
  const [summary] = useState<SummaryVM>();
  const [isLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshNeeded = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoading={isLoading} summary={summary} onRefreshNeeded={handleRefreshNeeded} />

      <main className="px-4 py-8">
        <DashboardContent key={refreshTrigger} />
      </main>
    </div>
  );
}
