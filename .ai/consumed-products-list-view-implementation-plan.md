# View Implementation Plan: Consumed Products List

## 1. Overview
This document outlines the implementation plan for the "Consumed Products List" view. This view will display a list of all food items a user has consumed on the current day. It will allow users to review their daily intake and delete entries if necessary. The view is a key part of the main dashboard, providing detailed data that complements the daily summary panel.

## 2. View Routing
The component will not have a dedicated route. It will be rendered on the main dashboard page, located at `/dashboard`. It should be placed directly below the `SummaryPanel` component within the `DashboardContent` component.

## 3. Component Structure
The feature will be composed of three main React components, organized in a clear hierarchy.

```
/src/components/dashboard/
├── DashboardContent.tsx (Existing)
│   └── ConsumedProductsList.tsx (New Container)
│       ├── ProductEntryItem.tsx (New Presentational)
│       └── DeleteConfirmationModal.tsx (New Presentational, from ui/dialog)
```

## 4. Component Details

### `ConsumedProductsList`
- **Component description**: This is the container component responsible for fetching and managing the state of the consumed products list. It handles all API interactions and renders the list of entries or corresponding UI states (loading, error, empty).
- **Main elements**:
    - A title, e.g., `<h2>Today's Entries</h2>`.
    - A loading state indicator (e.g., skeleton loaders).
    - An error message display area.
    - An empty state message (e.g., "No entries logged today.").
    - An unordered list (`<ul>`) that maps over the entries and renders a `ProductEntryItem` for each.
- **Handled interactions**:
    - Initiates data fetching on component mount.
    - Receives a `delete` request from a `ProductEntryItem`.
    - Opens and manages the `DeleteConfirmationModal`.
    - Triggers the API call to delete an entry upon confirmation.
- **Handled validation**: None.
- **Types**: `EntryDto[]`.
- **Props**:
    - `onEntriesChange: () => void;` (A callback function to notify the parent component that the list has changed, e.g., after a deletion, to trigger a summary refresh).

### `ProductEntryItem`
- **Component description**: A presentational component that displays the details of a single consumed product.
- **Main elements**:
    - A list item element (`<li>`).
    - A `div` for the product's name and quantity (e.g., "Chicken Breast - 200g").
    - A `div` displaying the nutritional information (Calories, Protein, Fat, Carbs).
    - A "Delete" `Button` component with an icon.
- **Handled interactions**:
    - On clicking the "Delete" button, it invokes the `onDelete` prop with the entry's ID.
- **Handled validation**: None.
- **Types**: `EntryDto`.
- **Props**:
    - `entry: EntryDto;`
    - `onDelete: (entryId: string) => void;`

### `DeleteConfirmationModal`
- **Component description**: A reusable modal dialog that asks the user for confirmation before performing a destructive action, such as deleting an entry. It will be built using the existing `Dialog` component from `shadcn/ui`.
- **Main elements**:
    - `DialogHeader` with a title like "Confirm Deletion".
    - `DialogDescription` with a message, e.g., "Are you sure you want to delete this entry? This action cannot be undone."
    - `DialogFooter` with "Cancel" and "Delete" buttons.
- **Handled interactions**:
    - Clicking "Delete" invokes the `onConfirm` callback.
    - Clicking "Cancel" or closing the dialog invokes the `onCancel` callback.
- **Handled validation**: None.
- **Types**: None.
- **Props**:
    - `isOpen: boolean;`
    - `onConfirm: () => void;`
    - `onCancel: () => void;`
    - `entryName: string;` (To display in the confirmation message).

## 5. Types

### `EntryDto` (Data Transfer Object)
This interface represents a single food entry as returned by the API. It will be used throughout the new components.

```typescript
export interface EntryDto {
  entryId: string; // UUID
  productId: string; // UUID
  name: string;
  quantity: number; // in grams
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  consumedAt: string; // ISO 8601 Date string
}
```

### `GetEntriesResponseDto`
This interface represents the full response object from the `GET /api/entries` endpoint.

```typescript
export interface GetEntriesResponseDto {
  data: EntryDto[];
}
```

No new custom ViewModel types are required, as the `EntryDto` can be used directly for rendering.

## 6. State Management
State will be managed within the `ConsumedProductsList` component using a custom hook, `useEntries`, to encapsulate data fetching logic, state, and actions.

### Custom Hook: `useEntries`
- **File**: `src/lib/hooks/useEntries.ts`
- **Purpose**: To abstract the logic for fetching, deleting, and managing the state of product entries.
- **Exposed State & Functions**:
    - `entries: EntryDto[]`: The array of entries for the current day, sorted chronologically.
    - `isLoading: boolean`: The loading state.
    - `error: Error | null`: Any error that occurred during fetching.
    - `deleteEntry: (entryId: string) => Promise<void>`: A function to delete an entry.
- **Internal Logic**:
    - Uses `useEffect` to fetch entries for the current date on initial render.
    - Manages `isLoading` and `error` states internally.
    - The `deleteEntry` function will make the API call and, on success, update the `entries` state by filtering out the deleted item, avoiding a full refetch.

## 7. API Integration

### Fetching Entries
- **Endpoint**: `GET /api/entries`
- **Action**: The `useEntries` hook will call this endpoint when the component mounts.
- **Request**: A query parameter `date` will be appended with the current date in `YYYY-MM-DD` format (e.g., `/api/entries?date=2025-10-26`).
- **Response Type**: `GetEntriesResponseDto`. The hook will process this to extract and sort the `data` array.

### Deleting an Entry
- **Endpoint**: `DELETE /api/entries/{entryId}`
- **Action**: The `deleteEntry` function in the `useEntries` hook will call this endpoint.
- **Request**: The `entryId` (UUID) will be passed as a path parameter (e.g., `/api/entries/123e4567-e89b-12d3-a456-426614174000`).
- **Response**: Expects a `204 No Content` status on success. The response body will be empty.

## 8. User Interactions
1.  **View Load**: User navigates to the dashboard. The `ConsumedProductsList` shows a skeleton loader while `useEntries` fetches data.
2.  **View Success**: The list of products appears, sorted with the most recent entry at the top.
3.  **View Empty**: If no products are logged for the day, a message like "No entries logged today" is displayed.
4.  **Delete Action**:
    - User clicks the delete icon next to an entry in `ProductEntryItem`.
    - `onDelete` callback is triggered, telling `ConsumedProductsList` which entry to delete.
    - `ConsumedProductsList` opens the `DeleteConfirmationModal` with the context of the selected entry.
5.  **Delete Confirmation**:
    - User clicks "Delete" in the modal.
    - The `deleteEntry` function is called. The item is removed from the UI, and the daily summary is updated. A success toast is shown.
6.  **Delete Cancellation**:
    - User clicks "Cancel" or closes the modal. The modal closes, and no changes are made.

## 9. Conditions and Validation
- **Authentication**: The frontend assumes the user is authenticated. API calls that fail with a `401 Unauthorized` status should be handled globally, possibly by redirecting to a login page.
- **Ownership**: If a `DELETE` request fails with `403 Forbidden`, the user should be notified that they do not have permission to perform that action.
- **Data Existence**: If a `DELETE` request fails with `404 Not Found`, it means the entry was already deleted. The UI should gracefully handle this by refreshing the list and informing the user.

## 10. Error Handling
- **Fetch Error**: If the `GET /api/entries` call fails, the component will display an inline error message: "Could not load entries. Please try refreshing the page."
- **Delete Error**: If the `DELETE /api/entries/{entryId}` call fails, a toast notification will appear with a user-friendly message corresponding to the error type (e.g., "Failed to delete entry. Please try again.").
- **UI State**: In case of a delete error, the UI should remain in its pre-action state (the item is not removed from the list).

## 11. Implementation Steps
1.  **Create Types**: Add the `EntryDto` and `GetEntriesResponseDto` interfaces to `src/types.ts`.
2.  **Implement `useEntries` Hook**: Create the new file `src/lib/hooks/useEntries.ts`. Implement the logic for fetching, state management, sorting, and deleting entries as described in the State Management section.
3.  **Create `ProductEntryItem` Component**: Create the file `src/components/dashboard/ProductEntryItem.tsx`. Implement the stateless component to render a single entry's data and a delete button. Use Tailwind CSS for styling.
4.  **Create `ConsumedProductsList` Component**: Create the file `src/components/dashboard/ConsumedProductsList.tsx`.
    - Use the `useEntries` hook to get data and actions.
    - Implement the rendering logic for loading, error, empty, and data states.
    - Render a list of `ProductEntryItem` components.
    - Integrate a `shadcn/ui` Dialog component to act as the `DeleteConfirmationModal`.
5.  **Integrate into `DashboardContent`**:
    - Modify `src/components/dashboard/DashboardContent.tsx`.
    - Import and render the `ConsumedProductsList` component below the `SummaryPanel`.
    - The `DashboardContent` should already be using `useSummary`. Pass a `refetch` function from `useSummary` down to `ConsumedProductsList` as the `onEntriesChange` prop.
6.  **Testing**: Manually test all user flows: successful data load, empty state, loading state, error state, and the complete deletion flow (including confirmation and cancellation). Ensure the summary panel updates correctly after deletion.
