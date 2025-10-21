import React from "react";
import { useSummary } from "../../lib/hooks/useSummary";
import { SummaryPanel } from "./SummaryPanel";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface RefreshButtonProps {
  disabled: boolean;
  onClick: () => void;
}

function RefreshButton({ disabled, onClick }: RefreshButtonProps): React.ReactNode {
  return (
    <Button onClick={onClick} disabled={disabled} size="default">
      Refresh
    </Button>
  );
}

interface ErrorAlertProps {
  message: string;
  onRetry: () => void;
}

function ErrorAlert({ message, onRetry }: ErrorAlertProps): React.ReactNode {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <AlertTitle>Error loading summary</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </div>
          <Button onClick={onRetry} variant="outline" size="sm" className="ml-4 flex-shrink-0">
            Retry
          </Button>
        </div>
      </Alert>
    </div>
  );
}

function Spinner(): React.ReactNode {
  return (
    <div className="w-full max-w-2xl mx-auto flex justify-center items-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/20 border-t-primary" />
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
