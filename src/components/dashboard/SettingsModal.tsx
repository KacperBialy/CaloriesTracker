import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
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
        method: "PUT",
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton data-test-id="settings-modal">
        <DialogHeader>
          <DialogTitle>Daily Calorie Goal</DialogTitle>
          <DialogDescription>Set your target daily calorie intake to track your progress</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" data-test-id="settings-modal-form">
          {/* Goal Input */}
          <div>
            <label htmlFor="daily-goal" className="block text-sm font-medium mb-2">
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
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="e.g., 2000"
              data-test-id="settings-modal-goal-input"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter a positive number for your daily target.</p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" data-test-id="settings-modal-error">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <DialogFooter>
            <Button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              variant="outline"
              data-test-id="settings-modal-cancel"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !isValidGoal(goalInput)} data-test-id="settings-modal-save">
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
