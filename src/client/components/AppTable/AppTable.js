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
        rows = rows.filter(row => row.school === state.filterSchool);
      }
      this.updateRows(rows, state.loading);
    });
  }

  render() {
      this.shadowRoot.innerHTML = AppTableTemplate;
  }

  updateRows(rows, isLoading) {
    const container = this.shadowRoot.getElementById('requests-table-body');
    if (isLoading) return;

    container.innerHTML = ''; // Clear the "Loading" message
    
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