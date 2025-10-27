import React, { useCallback } from "react";
import { Settings, LogOut, AlertCircle } from "lucide-react";
import { SettingsModal } from "./SettingsModal";
import { useAuth } from "../../lib/hooks/useAuth";
import type { SummaryVM } from "../../types";

interface HeaderProps {
  isLoading: boolean;
  summary?: SummaryVM;
  onRefreshNeeded: () => void;
}

/**
 * Header component displays the top navigation bar with settings and logout controls.
 * Manages user state verification, SettingsModal state, and handles user logout flow.
 * Includes proper error handling and user feedback for authentication issues.
 */
export function Header({ isLoading, summary, onRefreshNeeded }: HeaderProps): React.ReactNode {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { isLoading: isAuthLoading, error: authError, logout } = useAuth();

  // Handle logout with useCallback for optimized event handling
  const handleLogout = useCallback(async (): Promise<void> => {
    if (isAuthLoading) return; // Prevent multiple logout attempts

    await logout();
  }, [logout, isAuthLoading]);

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
            {/* Auth Error Alert */}
            {authError && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* Settings Icon Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              disabled={isLoading || isAuthLoading}
              aria-label="Open settings"
              title="Settings"
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Settings size={20} />
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              disabled={isLoading || isAuthLoading}
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
