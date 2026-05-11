// @ts-ignore
import RequestsTableStyles from './RequestsTable.css?inline';
// @ts-ignore
import RequestsTableTemplate from './RequestsTable.htm?raw';
import { store } from '../../services/state';
import '../RequestsRow/RequestsRow'; // Ensure the row component is registered
import { TranslationRequest } from '../../../shared/types';

const sheet = new CSSStyleSheet();
sheet.replaceSync(RequestsTableStyles);

/**
 * RequestsTable: A reactive custom element that displays the list of requests.
 * It subscribes to the global store and automatically re-renders when
 * filters or data change.
 */
class RequestsTable extends HTMLElement {
  constructor() {
    super();
    // Use 'open' mode so we can access the shadowRoot from the outside if needed,
    // though we primarily manage it internally.
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      // Use adoptedStyleSheets for better performance and style sharing.
      // This allows the browser to parse the CSS only once.
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  private _lastRowsJson = '';

  /**
   * connectedCallback is called when the element is added to the document.
   * This is where we trigger the initial render and set up subscriptions.
   */
  connectedCallback() {
    this.render();

    store.subscribe((state) => {
      let rows = state.allRows;

      if (state.filterSchool) {
        if (state.filterSchool === 'Other') {
          rows = rows.filter((row) => !state.schools.includes(row.school));
        } else {
          rows = rows.filter((row) => row.school === state.filterSchool);
        }
      }

      if (state.filterStatuses && state.filterStatuses.length > 0) {
        rows = rows.filter((row) => state.filterStatuses.includes(row.status));
      }

      // ONLY re-render if the actual content or loading state changed.
      // This prevents the table from flickering/rebuilding when a row is selected.
      const rowsJson = JSON.stringify(rows) + state.loading;
      if (rowsJson !== this._lastRowsJson) {
        this._lastRowsJson = rowsJson;
        this.updateRows(rows, state.loading);
      }
    });
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = RequestsTableTemplate;
    }
  }

  updateRows(rows: TranslationRequest[], isLoading: boolean) {
    const container = this.shadowRoot?.getElementById('requests-table-body');
    const resultsCount = document.getElementById('results-count');

    if (!container) return;

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

    rows.forEach((rowData) => {
      // Create our custom row element
      const rowEl = document.createElement('app-row') as any;
      container.appendChild(rowEl);

      // Pass the row data directly to the child component
      rowEl.data = rowData;
    });
  }
}

customElements.define('app-table', RequestsTable);

declare global {
  interface HTMLElementTagNameMap {
    'app-table': RequestsTable;
  }
}
