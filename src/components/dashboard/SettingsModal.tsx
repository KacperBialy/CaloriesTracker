import React, { useState, useRef, useEffect } from "react";
import type { UpsertUserGoalCommand } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  currentGoal: number | null;
}

/**
 * SettingsModal is a dialog for viewing and updating the user's daily calorie goal.
 * Includes form validation, API integration, and error handling.
 */
export function SettingsModal({ isOpen, onClose, onSaveSuccess, currentGoal }: SettingsModalProps): React.ReactNode {
  const [goalInput, setGoalInput] = useState<string>(currentGoal?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const isValidGoal = (value: string): boolean => {
    if (!value.trim()) return false;
    const num = parseInt(value, 10);
    return !Number.isNaN(num) && num > 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(undefined);

    if (!isValidGoal(goalInput)) {
      setError("Please enter a valid positive number for your daily goal.");
      return;
    }

    const dailyCalorieGoal = parseInt(goalInput, 10);
    const command: UpsertUserGoalCommand = { dailyCalorieGoal };

    setLoading(true);

    try {
      const response = await fetch("/api/user-goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(command),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save goal (${response.status}): ${errorText || response.statusText}`);
      }

      // Success: notify parent and close modal
      onSaveSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setGoalInput(currentGoal?.toString() ?? "");
    setError(undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Daily Calorie Goal</h2>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Goal Input */}
            <div>
              <label htmlFor="daily-goal" className="block text-sm font-medium text-gray-700 mb-2">
                Daily Calorie Goal (kcal)
              </label>
              <input
                ref={inputRef}
                id="daily-goal"
                type="number"
                min="1"
                max="999999"
                value={goalInput}
                onChange={(e) => {
                  setGoalInput(e.target.value);
                  setError(undefined);
                }}
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="e.g., 2000"
              />
              <p className="text-xs text-gray-500 mt-1">Enter a positive number for your daily target.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isValidGoal(goalInput)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
