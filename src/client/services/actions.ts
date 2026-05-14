import { store } from './state';
import { saveRequest, deleteRequest, addRequest } from './api';
import { showToast } from './ui';

/**
 * RequestActions: Encapsulates the business logic for managing requests.
 * Handles API calls, global state updates, and optimistic UI rollbacks.
 */
export const requestActions = {
  /**
   * Saves changes to an existing request.
   */
  async save(request: TranslationRequest): Promise<TranslationRequest> {
    try {
      const savedData = await saveRequest(request);
      
      const { allRows } = store.getState();
      const updatedRows = allRows.map((row) => (row.id === savedData.id ? savedData : row));

      store.setState({
        allRows: updatedRows,
        selectedRow: savedData,
      });
      
      showToast("Changes saved successfully.");
      return savedData;
    } catch (err) {
      console.error('Failed to save request:', err);
      showToast("Error: Failed to save changes.", 5000);
      throw err;
    }
  },

  /**
   * Deletes a request with optimistic UI updates.
   * If the API call fails, it rolls back the state.
   */
  async delete(request: TranslationRequest): Promise<void> {
    const previousRows = [...store.getState().allRows];
    const previousSelected = store.getState().selectedRow;

    // Optimistic Update: Remove from UI immediately
    store.setState({
      allRows: previousRows.filter((row) => row.id !== request.id),
      selectedRow: null,
    });
    
    showToast("Deleting request...");

    try {
      await deleteRequest(request);
      showToast("Request deleted successfully.");
    } catch (err) {
      console.error('Failed to delete request:', err);
      
      // Rollback state on failure
      store.setState({
        allRows: previousRows,
        selectedRow: previousSelected,
      });
      
      showToast("Error: Could not delete. Restoring data...", 5000);
      throw err;
    }
  },

  /**
   * Creates a new request and updates the dashboard view.
   */
  async create(request: Partial<TranslationRequest>): Promise<TranslationRequest> {
    try {
      const savedRequest = await addRequest(request as TranslationRequest);

      const { allRows } = store.getState();
      store.setState({
        allRows: [savedRequest, ...allRows],
        selectedRow: savedRequest,
        activeView: 'dashboard',
      });

      showToast("Request submitted successfully.");
      return savedRequest;
    } catch (err) {
      console.error('Failed to create request:', err);
      showToast("Error: Failed to submit request.", 5000);
      throw err;
    }
  }
};
