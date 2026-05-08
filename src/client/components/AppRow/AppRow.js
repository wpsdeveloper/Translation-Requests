import AppRowStyles from './AppRow.css?inline';
import AppRowTemplate from './AppRow.htm?raw';
import '../StatusBadge/StatusBadge';
import { store } from '../../services/state.js';
import { formatDate } from '../../services/utils';

const sheet = new CSSStyleSheet();
sheet.replaceSync(AppRowStyles);

class AppRow extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._data = {};
  }

  // Setter called by the parent Table
  set data(value) {
    this._data = value;
    if (this.isConnected) {
      this.render();
    }
  }

  connectedCallback() {
    if (this._data && Object.keys(this._data).length > 0) {
      this.render();
    }

    this.addEventListener('click', () => {
      const panel = document.querySelector('details-panel');
      if (panel && panel.mode === 'edit') return;

      // UPDATE STATE: Tell the app which row was selected
      store.setState({
        selectedRow: this._data,
        isPanelOpen: true,
      });
    });
  }

  render() {
    // Note: We don't use Shadow DOM here so we can stay 
    // inside the parent table's styling context easily.
    this.shadowRoot.innerHTML = AppRowTemplate;
    this.populateData();

    // Optional: Add a class if this row is the one currently selected
    this.checkSelection();
  }

  populateData() {
    this.shadowRoot.querySelector('.status-cell').setAttribute('status', this._data.status);
    this.shadowRoot.querySelector('.request-date').textContent = formatDate(this._data.requestDate, 'MMM D, YYYY') || '';
    this.shadowRoot.querySelector('.submitted-date').textContent = formatDate(this._data.submittedDate, 'MMM D, YYYY') || '';
    this.shadowRoot.querySelector('.reqType').textContent = this._data.reqType || '';
    this.shadowRoot.querySelector('.requester-name').textContent = this._data.name || '';
    this.shadowRoot.querySelector('.requester-school').textContent = this._data.school || '';
  }

  checkSelection() {
    const state = store.getState();
    if (state.selectedRow?.id === this._data.id) {
      this.shadowRoot.querySelectorAll('.td').forEach(td => {
        td.style.backgroundColor = '#e8f0fe';
      });
    } else {
      this.shadowRoot.querySelectorAll('.td').forEach(td => {
        td.style.backgroundColor = 'transparent';
      });
    }
  }
}

customElements.define('app-row', AppRow);