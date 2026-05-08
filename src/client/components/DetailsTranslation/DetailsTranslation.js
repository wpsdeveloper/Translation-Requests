import styles from './DetailsTranslation.css?inline';
import template from './DetailsTranslation.htm?raw';
import '../ContractorSelect/ContractorSelect.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DetailsTranslation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._data = {};
  }

  set data(value) {
    this._data = value;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = template;
    // Hydrate
    // this.shadowRoot.querySelector('#detail-document-link').textContent = this._data.docLink || 'N/A';
    this.shadowRoot.querySelector('#detail-document-length').textContent = this._data.docPageCount || 'N/A';

    const link = this.shadowRoot.querySelector('.file-link');
    link.href = this._data.docLink || '#';
    link.style.display = this._data.docLink ? 'inline' : 'none';

    const contractorSelect = this.shadowRoot.querySelector('#contractor-select');
    if (contractorSelect) {
      contractorSelect.value = {
        contractor: this._data.contractor,
        name: this._data.contractorName
      };
    }
  }
}

customElements.define('details-translation', DetailsTranslation);