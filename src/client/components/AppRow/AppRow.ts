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

class AppRow extends HTMLElement {
  private _data: TranslationRequest = {} as TranslationRequest;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  // Setter called by the parent Table
  set data(value: TranslationRequest) {
    this._data = value;
    if (this.isConnected) {
      this.render();
    }
  }

  get data(): TranslationRequest {
    return this._data;
  }

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
