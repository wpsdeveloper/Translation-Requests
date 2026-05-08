import styles from './ContractorSelect.css?inline';
import template from './ContractorSelect.htm?raw';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class ContractorSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._mode = 'view';
    this._data = { contractor: '', name: '' };
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = template;
  }

  setupEventListeners() {
    const select = this.shadowRoot.querySelector('#contractor-dropdown');
    const manualEntry = this.shadowRoot.querySelector('#manual-entry');
    const nameInput = this.shadowRoot.querySelector('#contractor-name');
    
    select.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'Staff Member' || val === 'Private Contractor') {
        manualEntry.style.display = 'block';
      } else {
        manualEntry.style.display = 'none';
        nameInput.value = ''; // Clear name if not needed
      }
      
      // Dispatch custom event for parent components
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          contractor: val,
          name: nameInput.value
        },
        bubbles: true,
        composed: true
      }));
    });

    nameInput.addEventListener('input', (e) => {
      this._data.name = e.target.value;
      this.dispatchEvent(new CustomEvent('change', {
        detail: {
          contractor: select.value,
          name: e.target.value
        },
        bubbles: true,
        composed: true
      }));
    });
  }

  get mode() {
    return this._mode;
  }

  set mode(value) {
    this._mode = value;
    const root = this.shadowRoot;
    const viewEl = root.querySelector('#view-mode');
    const editEl = root.querySelector('#edit-mode');

    if (viewEl && editEl) {
      viewEl.style.display = value === 'view' ? 'block' : 'none';
      editEl.style.display = value === 'edit' ? 'block' : 'none';
    }
    this.updateViewValue();
  }

  updateViewValue() {
    const viewValue = this.shadowRoot.querySelector('#view-value');
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

  get value() {
    const select = this.shadowRoot.querySelector('#contractor-dropdown');
    const nameInput = this.shadowRoot.querySelector('#contractor-name');
    return {
      contractor: select.value,
      name: nameInput.value
    };
  }

  set value(data) {
    this._data = data || { contractor: '', name: '' };
    const select = this.shadowRoot.querySelector('#contractor-dropdown');
    const manualEntry = this.shadowRoot.querySelector('#manual-entry');
    const nameInput = this.shadowRoot.querySelector('#contractor-name');

    if (select) {
      select.value = this._data.contractor || '';
      if (this._data.contractor === 'Staff Member' || this._data.contractor === 'Private Contractor') {
        manualEntry.style.display = 'block';
        if (this._data.name) nameInput.value = this._data.name;
      } else {
        manualEntry.style.display = 'none';
      }
    }
    this.updateViewValue();
  }
}

customElements.define('contractor-select', ContractorSelect);
