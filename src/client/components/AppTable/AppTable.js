import AppTableStyles from './AppTable.css?inline';
import AppTableTemplate from './AppTable.htm?raw';
import { store } from '../../services/state.js';
import '../AppRow/AppRow.js'; // Ensure the row component is registered

const sheet = new CSSStyleSheet();
sheet.replaceSync(AppTableStyles);

class AppTable extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    this.render();

    // Subscribe to the store to wait for the sheet data
    store.subscribe((state) => {
      let rows = state.allRows;
      if (state.filterSchool) {
        if (state.filterSchool === 'Other') {
          // Show rows where the school is not in the official list
          rows = rows.filter(row => !state.schools.includes(row.school));
        } else {
          rows = rows.filter(row => row.school === state.filterSchool);
        }
      }

      if (state.filterStatuses && state.filterStatuses.length > 0) {
        rows = rows.filter(row => state.filterStatuses.includes(row.status));
      }

      this.updateRows(rows, state.loading);
    });
  }

  render() {
    this.shadowRoot.innerHTML = AppTableTemplate;
  }

  updateRows(rows, isLoading) {
    const container = this.shadowRoot.getElementById('requests-table-body');
    const resultsCount = document.getElementById('results-count');

    if (isLoading) {
      container.innerHTML = `
        <div class="table-message">
          <div class="spinner"></div>
          <div>Loading requests...</div>
        </div>
      `;
      if (resultsCount) resultsCount.textContent = 'Loading...';
      return;
    }

    container.innerHTML = ''; 

    if (rows.length === 0) {
      container.innerHTML = `
        <div class="table-message">
          <div>No records found for the selected filter.</div>
        </div>
      `;
      if (resultsCount) resultsCount.textContent = '0 entries';
      return;
    }

    if (resultsCount) {
      resultsCount.textContent = `${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}`;
    }

    rows.forEach(rowData => {
      // Create our custom row element
      const rowEl = document.createElement('app-row');
      container.appendChild(rowEl);

      // Pass the row data directly to the child component
      rowEl.data = rowData;
    });
  }
}

customElements.define('app-table', AppTable);