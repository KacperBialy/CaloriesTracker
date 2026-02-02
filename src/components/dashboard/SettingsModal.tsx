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
import { AlertCircle, Copy, Check } from "lucide-react";
import type { UpsertUserGoalCommand, ApiKeyDto } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  currentGoal: number | null;
}

/**
 * SettingsModal is a dialog for viewing and updating the user's daily calorie goal
 * and managing API keys. Includes form validation, API integration, and error handling.
 */
export function SettingsModal({ isOpen, onClose, onSaveSuccess, currentGoal }: SettingsModalProps): React.ReactNode {
  const [goalInput, setGoalInput] = useState<string>(currentGoal?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [apiKey, setApiKey] = useState<ApiKeyDto | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [apiKeyError, setApiKeyError] = useState<string>();
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch API key when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchApiKey();
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [isOpen]);

  const fetchApiKey = async (): Promise<void> => {
    try {
      const response = await fetch("/api/api-keys", { method: "GET" });
      if (response.ok) {
        const data = await response.json();
        setApiKey(data);
      } else if (response.status !== 404) {
        throw new Error("Failed to fetch API key");
      }
      // 404 means no key exists yet, which is fine
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setApiKeyError(msg);
    }
  };

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

  const handleGenerateApiKey = async (): Promise<void> => {
    setApiKeyError(undefined);
    setApiKeyLoading(true);

    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate API key (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      setApiKey(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setApiKeyError(errorMsg);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleRevokeApiKey = async (): Promise<void> => {
    setApiKeyError(undefined);
    setApiKeyLoading(true);

    try {
      const response = await fetch("/api/api-keys", { method: "DELETE" });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to revoke API key (${response.status}): ${errorText || response.statusText}`);
      }

      setApiKey(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred";
      setApiKeyError(errorMsg);
    } finally {
      setApiKeyLoading(false);
    }
  };

  const handleCopyApiKey = (): void => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey.key);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };

  const handleCancel = (): void => {
    setGoalInput(currentGoal?.toString() ?? "");
    setError(undefined);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton data-test-id="settings-modal" className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your daily goal and API key</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Daily Calorie Goal Section */}
          <form onSubmit={handleSubmit} className="space-y-4" data-test-id="settings-modal-form">
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
                disabled={loading || apiKeyLoading}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="e.g., 2000"
                data-test-id="settings-modal-goal-input"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter a positive number for your daily target.</p>
            </div>

            {/* Error Message for Goal */}
            {error && (
              <Alert variant="destructive" data-test-id="settings-modal-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Goal Form Actions */}
            <div className="flex justify-end gap-2">
              <Button
                type="submit"
                disabled={loading || apiKeyLoading || !isValidGoal(goalInput)}
                data-test-id="settings-modal-save"
              >
                {loading ? "Saving..." : "Save Goal"}
              </Button>
            </div>
          </form>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* API Key Section */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">API Key</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use your API key to authenticate requests to our API.
              </p>
            </div>

            {/* API Key Display */}
            {apiKey ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <input
                    type="text"
                    readOnly
                    value={apiKey.key}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-muted-foreground"
                    data-test-id="api-key-display"
                  />
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    disabled={apiKeyLoading}
                    className="p-1 hover:bg-background rounded transition-colors"
                    data-test-id="api-key-copy"
                  >
                    {copiedToClipboard ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Created: {new Date(apiKey.createdAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No API key generated yet</p>
            )}

            {/* API Key Error */}
            {apiKeyError && (
              <Alert variant="destructive" data-test-id="api-key-error">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{apiKeyError}</AlertDescription>
              </Alert>
            )}

            {/* API Key Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleGenerateApiKey}
                disabled={apiKeyLoading || loading}
                variant={apiKey ? "outline" : "default"}
                data-test-id="generate-api-key"
              >
                {apiKeyLoading ? "Processing..." : apiKey ? "Regenerate Key" : "Generate Key"}
              </Button>
              {apiKey && (
                <Button
                  type="button"
                  onClick={handleRevokeApiKey}
                  disabled={apiKeyLoading || loading}
                  variant="destructive"
                  data-test-id="revoke-api-key"
                >
                  Revoke
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Dialog Footer */}
        <DialogFooter>
          <Button
            onClick={handleCancel}
            disabled={loading || apiKeyLoading}
            variant="outline"
            data-test-id="settings-modal-cancel"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
