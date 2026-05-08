import styles from '../shared/DetailsStyles.css?inline';
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
    const isEdit = value === 'edit';
    const isProcess = value === 'process';

    // Fields above ContractorSelect (Edit mode)
    const editFields = ['#edit-document-length', '#edit-document-link'];
    const editViews = ['#view-document-length', '#view-document-link', '.file-link'];

    editFields.forEach(sel => {
      const el = root.querySelector(sel);
      if (el) el.style.display = isEdit ? 'block' : 'none';
    });
    editViews.forEach(sel => {
      const el = root.querySelector(sel);
      if (el) el.style.display = isEdit ? 'none' : '';
    });

    // Fields below and including ContractorSelect (Process mode)
    const processFields = ['#edit-date-sent', '#edit-date-received'];
    const processViews = ['#view-date-sent', '#view-date-received'];

    processFields.forEach(sel => {
      const el = root.querySelector(sel);
      if (el) el.style.display = isProcess ? 'block' : 'none';
    });
    processViews.forEach(sel => {
      const el = root.querySelector(sel);
      if (el) el.style.display = isProcess ? 'none' : '';
    });

    const contractorSelect = root.querySelector('#contractor-select');
    if (contractorSelect) {
      contractorSelect.mode = isProcess ? 'edit' : 'view';
    }
  }

  render() {
    this.shadowRoot.innerHTML = template;
    const root = this.shadowRoot;

    // View Mode Hydration
    root.querySelector('#view-document-length').textContent = this._data.docPageCount || 'N/A';
    const viewLink = root.querySelector('#view-document-link');
    viewLink.href = this._data.docLink || '#';
    viewLink.style.display = this._data.docLink ? 'inline' : 'none';

    // Formatting dates for view mode
    const sentDate = this._data.docSentDate ? new Date(this._data.docSentDate).toLocaleDateString() : 'N/A';
    const receivedDate = this._data.docReceivedDate ? new Date(this._data.docReceivedDate).toLocaleDateString() : 'N/A';
    root.querySelector('#view-date-sent').textContent = sentDate;
    root.querySelector('#view-date-received').textContent = receivedDate;

    // Edit Mode Hydration
    root.querySelector('#edit-document-length').value = this._data.docPageCount || '';
    root.querySelector('#edit-document-link').value = this._data.docLink || '';

    // Date inputs expect YYYY-MM-DD
    const formatDateForInput = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
    root.querySelector('#edit-date-sent').value = formatDateForInput(this._data.docSentDate);
    root.querySelector('#edit-date-received').value = formatDateForInput(this._data.docReceivedDate);

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

customElements.define('details-translation', DetailsTranslation);