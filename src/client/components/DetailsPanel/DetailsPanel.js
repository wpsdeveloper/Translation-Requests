import { store } from '../../services/state.js';
import { formatDate } from '../../services/utils.js';
import panelTemplate from './DetailsPanel.htm?raw';
import sharedPanelStyles from '../shared/DetailsStyles.css?inline';
import panelStyles from './DetailsPanel.css?inline';

import '../DetailsInterpretation/DetailsInterpretation.js';
import '../DetailsTranslation/DetailsTranslation.js';
import '../StatusSelect/StatusSelect.js';

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedPanelStyles);

const panelSheet = new CSSStyleSheet();
panelSheet.replaceSync(panelStyles);

class DetailsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sharedSheet, panelSheet];
    this._mode = 'view';
  }

  get mode() {
    return this._mode;
  }

  connectedCallback() {
    this.render();

    // Subscribe to the store to react when a row is clicked
    store.subscribe((state) => {
      if (state.selectedRow) {
        this.hydrate(state.selectedRow);
        this.classList.add('open'); // Show panel
      } else {
        this.classList.remove('open'); // Hide panel
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.id === 'close-btn') {
        store.setState({ selectedRow: null });
        this.setMode('view');
      }
      if (e.target.id === 'edit-btn') this.setMode('edit');
      if (e.target.id === 'cancel-btn') this.setMode('view');
      if (e.target.id === 'save-btn') {
        // Here you would eventually handle the save logic
        this.setMode('view');
      }
    });
  }

  setMode(mode) {
    this._mode = mode;
    const root = this.shadowRoot;
    const isEdit = mode === 'edit';

    root.querySelector('#edit-btn').style.display = isEdit ? 'none' : 'inline-block';
    root.querySelector('#save-btn').style.display = isEdit ? 'inline-block' : 'none';
    root.querySelector('#cancel-btn').style.display = isEdit ? 'inline-block' : 'none';

    // Notify the dynamic component
    const dynamicEl = root.querySelector('#dynamic-content').firstElementChild;
    if (dynamicEl && 'mode' in dynamicEl) {
      dynamicEl.mode = mode;
    }

    const statusSelect = root.querySelector('#detail-status');
    if (statusSelect) {
      statusSelect.mode = mode;
    }
  }

  render() {
    this.shadowRoot.innerHTML = panelTemplate;
  }

  hydrate(data) {
    const root = this.shadowRoot;

    // 1. Hydrate Shared Fields
    const statusSelect = root.querySelector('#detail-status');
    if (statusSelect) {
      statusSelect.status = data.status;
      statusSelect.mode = this._mode;
    }
    root.querySelector('#detail-submitted').textContent = formatDate(data.submittedDate, "MMM D, YYYY");
    root.querySelector('#detail-reqType').textContent = data.reqType;
    root.querySelector('#detail-requester').textContent = `${data.name} (${data.school})`;
    root.querySelector('#detail-languages').textContent = `${data.originalLanguage} to ${data.targetLanguage}`;
    root.querySelector('#detail-description').textContent = data.description || 'No description provided.';

    // 2. Hydrate Dynamic Content
    const container = root.querySelector('#dynamic-content');
    container.innerHTML = ''; // Clear previous view

    let featureEl;
    if (data.reqType === 'Interpretation') {
      featureEl = document.createElement('details-interpretation');
      featureEl.classList.add('details-interpretation');
    } else if (data.reqType === 'Translation') {
      featureEl = document.createElement('details-translation');
      featureEl.classList.add('details-translation');
    }

    if (featureEl) {
      container.appendChild(featureEl);
      featureEl.data = data; // Push data into the new component
      featureEl.mode = this._mode; // Set initial mode
    }
  }
}

customElements.define('details-panel', DetailsPanel);