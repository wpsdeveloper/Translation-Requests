/// <reference types="google-apps-script" />

import { store } from './services/state.js';
import { fetchData } from './services/api.js';
import './components/AppTable/AppTable.js';
import './components/DetailsPanel/DetailsPanel';
import './components/StatusMultiSelect/StatusMultiSelect.js';

/**
 * Main Application Orchestrator
 */
class App {
  constructor() {
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initializes the application state by fetching data from the server.
   */
  async init() {
    // 1. Set initial loading state
    store.setState({ loading: true, allRows: [] });

    try {
      // 2. Fetch the data (either mock or GAS)
      const { requests, schools } = await fetchData();
      console.log('App initialized with data:', { requests, schools });

      // 3. Update the store
      // This triggers components to update automatically
      store.setState({
        allRows: requests,
        schools: schools,
        loading: false,
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      store.setState({ loading: false, error: err.message });
    }
  }

  /**
   * Sets up global event listeners for the application.
   */
  setupEventListeners() {
    // 1. School Filter Synchronization
    const schoolFilter = document.getElementById('school-filter');
    if (schoolFilter) {
      schoolFilter.addEventListener('change', (e) => {
        store.setState({ filterSchool: e.detail.value });
      });
    }

    // 2. Global click listener to handle "outside clicks" for closing panels
    window.addEventListener('click', (e) => {
      const panel = document.querySelector('details-panel');
      // If the panel is in edit mode, we don't want to close it accidentally
      if (panel && panel.mode === 'edit') return;

      const path = e.composedPath();
      const isPanel = path.some((el) => el.tagName === 'DETAILS-PANEL');
      const isRow = path.some((el) => el.tagName === 'APP-ROW');

      // If clicking outside both the panel and the table rows, clear selection
      if (!isPanel && !isRow) {
        store.setState({ selectedRow: null });
      }
    });
  }
}

// Instantiate the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});
