import styles from './DetailsInterpretation.css?inline';
import template from './DetailsInterpretation.htm?raw';
import '../ContractorSelect/ContractorSelect.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DetailsInterpretation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._data = {};
    this._mode = 'view';
  }

  set data(value) {
    this._data = value;
    this.render();
  }

  get mode() {
    return this._mode;
  }

  set mode(value) {
    this._mode = value;
    const root = this.shadowRoot;
    const viewEls = root.querySelectorAll('.view-mode');
    const editEls = root.querySelectorAll('.edit-mode');

    viewEls.forEach(el => el.style.display = value === 'view' ? 'block' : 'none');
    editEls.forEach(el => el.style.display = value === 'edit' ? 'block' : 'none');

    const contractorSelect = root.querySelector('#contractor-select');
    if (contractorSelect) {
      contractorSelect.mode = value;
    }
  }

  render() {
    this.shadowRoot.innerHTML = template;
    const root = this.shadowRoot;

    // View Mode Hydration
    root.querySelector('.lang').textContent = this._data.language || 'N/A';
    root.querySelector('.loc').textContent = this._data.location || 'N/A';
    root.querySelector('.time').textContent = this._data.meetingTime || 'N/A';

    // Edit Mode Hydration
    root.querySelector('.edit-lang').value = this._data.language || '';
    root.querySelector('.edit-loc').value = this._data.location || '';
    root.querySelector('.edit-time').value = this._data.meetingTime || '';

    const contractorSelect = root.querySelector('#contractor-select');
    if (contractorSelect) {
      contractorSelect.value = {
        contractor: this._data.contractor,
        name: this._data.contractorName
      };
      contractorSelect.mode = this._mode;
    }

    this.mode = this._mode; // Apply current mode visibility
  }
}

customElements.define('details-interpretation', DetailsInterpretation);