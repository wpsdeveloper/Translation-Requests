import styles from './ContractorSelect.css?inline';
import template from './ContractorSelect.htm?raw';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class ContractorSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
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

  get value() {
    const select = this.shadowRoot.querySelector('#contractor-dropdown');
    const nameInput = this.shadowRoot.querySelector('#contractor-name');
    return {
      contractor: select.value,
      name: nameInput.value
    };
  }

  set value(data) {
    const select = this.shadowRoot.querySelector('#contractor-dropdown');
    const manualEntry = this.shadowRoot.querySelector('#manual-entry');
    const nameInput = this.shadowRoot.querySelector('#contractor-name');

    if (select && data.contractor) {
      select.value = data.contractor;
      if (data.contractor === 'Staff Member' || data.contractor === 'Private Contractor') {
        manualEntry.style.display = 'block';
        if (data.name) nameInput.value = data.name;
      } else {
        manualEntry.style.display = 'none';
      }
    }
  }
}

customElements.define('contractor-select', ContractorSelect);
