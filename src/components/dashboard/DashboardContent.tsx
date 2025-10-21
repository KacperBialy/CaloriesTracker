import React from "react";
import { useSummary } from "../../lib/hooks/useSummary";
import { SummaryPanel } from "./SummaryPanel";

interface RefreshButtonProps {
  disabled: boolean;
  onClick: () => void;
}

function RefreshButton({ disabled, onClick }: RefreshButtonProps): React.ReactNode {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
    >
      Refresh
    </button>
  );
}

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

function ErrorAlert({ message, onRetry }: ErrorAlertProps): React.ReactNode {
  return (
    <div className="w-full max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-red-800">Error loading summary</p>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        <button onClick={onRetry} className="ml-4 text-sm font-medium text-red-600 hover:text-red-700 underline">
          Retry
        </button>
      </div>
    </div>
  );
}

function Spinner(): React.ReactNode {
  return (
    <div className="w-full max-w-2xl mx-auto flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600" />
    </div>
  );
}

/**
 * DashboardContent orchestrates data fetching, loading, error, and success states.
 * Displays a spinner while loading, error alert on failure, or summary panel on success.
 */
export function DashboardContent(): React.ReactNode {
  const { data, loading, error, refetch } = useSummary();

  return (
    <div className="flex flex-col items-center gap-6">
      {loading && <Spinner />}

      {error && !loading && (
        <ErrorAlert message={error.message || "Failed to load summary. Please try again."} onRetry={refetch} />
      )}

      {data && !loading && !error && (
        <>
          <SummaryPanel summary={data} />
          <RefreshButton disabled={loading} onClick={refetch} />
        </>
      )}
    </div>
  );
}
