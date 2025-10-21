import React, { useState } from "react";
import { Settings, LogOut } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import type { SummaryVM } from "../../types";

interface HeaderProps {
  isLoading: boolean;
  summary?: SummaryVM;
  onRefreshNeeded: () => void;
}

/**
 * Header component displays the top navigation bar with settings and logout controls.
 * Manages the SettingsModal state and handles user logout flow.
 */
export function Header({ isLoading, summary, onRefreshNeeded }: HeaderProps): React.ReactNode {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async (): Promise<void> => {
    try {
      // Import supabase client dynamically to avoid circular dependencies
      const { supabaseClient } = await import("../../db/supabase.client");

      await supabaseClient.auth.signOut();
      // Redirect to login page
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed:", err);
      // Fallback redirect
      window.location.href = "/login";
    }
  };

  const handleSettingsSave = (): void => {
    // Trigger summary refresh after successful goal update
    onRefreshNeeded();
  };

  return (
    <>
      <header className="w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Left: Title */}
          <h1 className="text-2xl font-bold text-gray-900">Calories Tracker</h1>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Settings Icon Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              disabled={isLoading}
              aria-label="Open settings"
              title="Settings"
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Settings size={20} />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoading}
              aria-label="Logout"
              title="Logout"
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSuccess={handleSettingsSave}
        currentGoal={summary?.goal ?? null}
      />
    </>
  );
}
