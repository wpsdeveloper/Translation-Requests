// @ts-ignore
import AppRowStyles from './AppRow.css?inline';
// @ts-ignore
import AppRowTemplate from './AppRow.htm?raw';
import '../StatusBadge/StatusBadge';
import { store } from '../../services/state';
import { formatDate } from '../../services/utils';
import { TranslationRequest } from '../../../shared/types';

const sheet = new CSSStyleSheet();
sheet.replaceSync(AppRowStyles);

/**
 * AppRow: Represents a single row in the requests table.
 * Demonstrates the "Data Down, Events Up" pattern by receiving data via a setter
 * and notifying the store on user interaction.
 */
class AppRow extends HTMLElement {
  // Internal state for the row data.
  private _data: TranslationRequest = {} as TranslationRequest;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  /**
   * Complex data (like a Request object) should be passed via a property setter
   * rather than an attribute, to avoid expensive stringification.
   */
  set data(value: TranslationRequest) {
    this._data = value;
    // Only render if the element is actually in the DOM.
    if (this.isConnected) {
      this.render();
    }
  }

  get data(): TranslationRequest {
    return this._data;
  }

  /**
   * connectedCallback is called when the element is added to the document.
   * If data was set before the element was appended, render it now.
   */
  connectedCallback() {
    if (this._data && Object.keys(this._data).length > 0) {
      this.render();
    }

    this.addEventListener('click', () => {
      const panel = document.querySelector('details-panel') as any;
      if (panel && panel.mode === 'edit') return;

      // UPDATE STATE: Tell the app which row was selected
      store.setState({
        selectedRow: this._data,
        isPanelOpen: true,
      });
    });

    // Subscribe to store updates to handle selection highlighting
    store.subscribe(() => {
      this.checkSelection();
    });
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = AppRowTemplate;
    }
    this.populateData();
    this.checkSelection();
  }

  populateData() {
    const statusCell = this.shadowRoot?.querySelector('.status-cell');
    if (statusCell) statusCell.setAttribute('status', this._data.status);
    
    const reqDate = this.shadowRoot?.querySelector('.request-date');
    if (reqDate) reqDate.textContent = formatDate(this._data.requestDate, 'MMM D, YYYY') || '';
    
    const subDate = this.shadowRoot?.querySelector('.submitted-date');
    if (subDate) subDate.textContent = formatDate(this._data.submittedDate, 'MMM D, YYYY') || '';
    
    const reqType = this.shadowRoot?.querySelector('.reqType');
    if (reqType) reqType.textContent = this._data.reqType || '';
    
    const reqName = this.shadowRoot?.querySelector('.requester-name');
    if (reqName) reqName.textContent = this._data.name || '';
    
    const reqSchool = this.shadowRoot?.querySelector('.requester-school');
    if (reqSchool) reqSchool.textContent = this._data.school || '';
  }

  checkSelection() {
    const state = store.getState();
    const isSelected = state.selectedRow?.id === this._data.id;
    this.shadowRoot?.querySelectorAll('.td').forEach(td => {
      (td as HTMLElement).style.backgroundColor = isSelected ? '#e8f0fe' : 'transparent';
    });
  }
}

customElements.define('app-row', AppRow);

declare global {
  interface HTMLElementTagNameMap {
    'app-row': AppRow;
  }
}
