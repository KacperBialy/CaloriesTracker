import React, { useState, useCallback } from "react";
import { useEntries } from "@/lib/hooks/useEntries";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Trash2 } from "lucide-react";
import type { EntryDto } from "@/types";

interface ConsumedProductsListProps {
  onEntriesChange?: () => void;
}

/**
 * ConsumedProductsList is a container component that displays a table of consumed products
 * for the current day. It handles data fetching, loading/error states, and deletion workflows.
 */
export function ConsumedProductsList({ onEntriesChange }: ConsumedProductsListProps) {
  const { entries, isLoading, error, deleteEntry } = useEntries();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [selectedEntryName, setSelectedEntryName] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Handles delete button click - opens confirmation modal
   */
  const handleDeleteClick = useCallback((entry: EntryDto) => {
    setSelectedEntryId(entry.entryId);
    setSelectedEntryName(entry.name);
    setDeleteError(null);
    setDeleteModalOpen(true);
  }, []);

  /**
   * Handles delete confirmation
   */
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedEntryId) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteEntry(selectedEntryId);
      setDeleteModalOpen(false);
      setSelectedEntryId(null);
      setSelectedEntryName("");

      // Notify parent component of the change
      onEntriesChange?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete entry. Please try again.";
      setDeleteError(message);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedEntryId, deleteEntry, onEntriesChange]);

  /**
   * Handles delete cancellation
   */
  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setSelectedEntryId(null);
    setSelectedEntryName("");
    setDeleteError(null);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Entries</h2>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg border border-gray-200 bg-white animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error && !isLoading) {
    return (
      <div className="w-full space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Entries</h2>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error loading entries</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Empty state
  if (entries.length === 0 && !isLoading && !error) {
    return (
      <div className="w-full space-y-3">
        <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Entries</h2>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">No entries logged today</p>
          <p className="text-sm text-gray-500">Start tracking your meals to see them here</p>
        </div>
      </div>
    );
  }

  // Render table
  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Entries</h2>

      <div className="rounded-lg border border-gray-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-center">Calories</TableHead>
              <TableHead className="text-center">Protein</TableHead>
              <TableHead className="text-center">Fat</TableHead>
              <TableHead className="text-center">Carbs</TableHead>
              <TableHead className="text-right w-[80px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.entryId}>
                <TableCell className="font-medium">{entry.name}</TableCell>
                <TableCell className="text-center">{entry.quantity}g</TableCell>
                <TableCell className="text-center">{entry.nutrition.calories}</TableCell>
                <TableCell className="text-center">{entry.nutrition.protein}g</TableCell>
                <TableCell className="text-center">{entry.nutrition.fat}g</TableCell>
                <TableCell className="text-center">{entry.nutrition.carbs}g</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(entry)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    aria-label={`Delete ${entry.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{selectedEntryName}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{deleteError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
