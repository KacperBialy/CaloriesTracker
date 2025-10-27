import { useCallback, useState } from "react";

/**
 * Custom hook for managing user logout.
 * Provides logout functionality with proper error handling.
 */
export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Logout handler with proper error handling
  const logout = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Logout failed");
      }

      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to logout";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    logout,
  };
}
