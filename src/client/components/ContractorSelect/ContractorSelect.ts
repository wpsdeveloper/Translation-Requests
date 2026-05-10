// @ts-ignore
import styles from './ContractorSelect.css?inline';
// @ts-ignore
import sharedStyles from '../shared/DetailsStyles.css?inline';
// @ts-ignore
import template from './ContractorSelect.htm?raw';
import { PanelMode } from '../DetailsPanel/DetailsPanel';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);
const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedStyles);

interface ContractorData {
  contractor: string;
  name: string;
}

class ContractorSelect extends HTMLElement {
  private _mode: PanelMode = 'view';
  private _data: ContractorData = { contractor: '', name: '' };

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, sheet];
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
  }

  setupEventListeners() {
    const select = this.shadowRoot?.querySelector('#contractor-dropdown') as HTMLSelectElement;
    const manualEntry = this.shadowRoot?.querySelector('#manual-entry') as HTMLElement;
    const nameInput = this.shadowRoot?.querySelector('#contractor-name') as HTMLInputElement;

    select?.addEventListener('change', (e: any) => {
      const val = e.target.value;
      if (manualEntry) {
        if (val === 'Staff Member' || val === 'Private Contractor') {
          manualEntry.style.display = 'block';
        } else {
          manualEntry.style.display = 'none';
          if (nameInput) nameInput.value = ''; // Clear name if not needed
        }
      }

      // Dispatch custom event for parent components
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          contractor: val,
          name: nameInput?.value || ''
        },
        bubbles: true,
        composed: true
      }));
    });

    nameInput?.addEventListener('input', (e: any) => {
      this._data.name = e.target.value;
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          contractor: select?.value || '',
          name: e.target.value
        },
        bubbles: true,
        composed: true
      }));
    });
  }

  get mode(): PanelMode {
    return this._mode;
  }

  set mode(value: PanelMode) {
    this._mode = value;
    const root = this.shadowRoot;
    const viewEl = root?.querySelector('#view-mode') as HTMLElement;
    const editEl = root?.querySelector('#edit-mode') as HTMLElement;

    if (viewEl && editEl) {
      viewEl.style.display = value === 'view' ? '' : 'none';
      editEl.style.display = value === 'edit' ? '' : 'none';
    }
    this.updateViewValue();
  }

  updateViewValue() {
    const viewValue = this.shadowRoot?.querySelector('#view-value');
    if (!viewValue) return;

    const { contractor, name } = this._data;
    if (!contractor) {
      viewValue.textContent = 'None selected';
    } else if (contractor === 'Staff Member' || contractor === 'Private Contractor') {
      viewValue.textContent = `${contractor}: ${name || 'N/A'}`;
    } else {
      viewValue.textContent = contractor;
    }
  }

  get value(): ContractorData {
    const select = this.shadowRoot?.querySelector('#contractor-dropdown') as HTMLSelectElement;
    const nameInput = this.shadowRoot?.querySelector('#contractor-name') as HTMLInputElement;
    return {
      contractor: select?.value || '',
      name: nameInput?.value || ''
    };
  }

  set value(data: ContractorData) {
    this._data = data || { contractor: '', name: '' };
    const select = this.shadowRoot?.querySelector('#contractor-dropdown') as HTMLSelectElement;
    const manualEntry = this.shadowRoot?.querySelector('#manual-entry') as HTMLElement;
    const nameInput = this.shadowRoot?.querySelector('#contractor-name') as HTMLInputElement;

    if (select) {
      select.value = this._data.contractor || '';
      if (manualEntry) {
        if (this._data.contractor === 'Staff Member' || this._data.contractor === 'Private Contractor') {
          manualEntry.style.display = 'block';
          if (this._data.name && nameInput) nameInput.value = this._data.name;
        } else {
          manualEntry.style.display = 'none';
        }
      }
    }
    this.updateViewValue();
  }

  getSaveData() {
    return {
      contractor: (this.shadowRoot?.querySelector('#contractor-dropdown') as HTMLSelectElement)?.value || '',
      contractorName: (this.shadowRoot?.querySelector('#contractor-name') as HTMLInputElement)?.value || ''
    };
  }
}

customElements.define('contractor-select', ContractorSelect);

declare global {
  interface HTMLElementTagNameMap {
    'contractor-select': ContractorSelect;
  }
}
