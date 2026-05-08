import { store } from '../../services/state.js';
import { formatDate } from '../../services/utils.js';
import panelTemplate from './DetailsPanel.htm?raw';
import sharedPanelStyles from '../shared/DetailsStyles.css?inline';
import panelStyles from './DetailsPanel.css?inline';

import '../DetailsInterpretation/DetailsInterpretation.js';
import '../DetailsTranslation/DetailsTranslation.js';
import '../StatusSelect/StatusSelect.js';
import '../SchoolSelect/SchoolSelect.js';

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
      if (e.composedPath().some(el => el.id === 'edit-btn')) {
        this.setMode(this._mode === 'edit' ? 'view' : 'edit');
      }
      if (e.target.id === 'process-btn') this.setMode('process');
      if (e.target.id === 'cancel-btn') this.setMode('view');
      if (e.target.id === 'save-btn') {
        // Here you would eventually handle the save logic
        this.setMode('view');
      }
    });

    this.shadowRoot.addEventListener('change', (e) => {
      if (e.target.id === 'detail-status') {
        this.updateApprovalVisibility(e.detail.status);
      }
    });
  }

  setMode(mode) {
    this._mode = mode;
    const root = this.shadowRoot;
    const isEdit = mode === 'edit';
    const isProcess = mode === 'process';
    const isView = mode === 'view';

    root.querySelector('#process-btn').style.display = isView ? 'inline-block' : 'none';
    root.querySelector('#save-btn').style.display = !isView ? 'inline-block' : 'none';
    root.querySelector('#cancel-btn').style.display = !isView ? 'inline-block' : 'none';

    // Toggle shared view/edit elements (only in 'edit' mode)
    const sharedViewEls = root.querySelectorAll('.shared-meta .view-mode, .detail-item .view-mode');
    const sharedEditEls = root.querySelectorAll('.shared-meta .edit-mode, .detail-item .edit-mode');

    sharedViewEls.forEach((el) => (el.style.display = isEdit ? 'none' : ''));
    sharedEditEls.forEach((el) => (el.style.display = isEdit ? '' : 'none'));

    // Notify the dynamic component
    const dynamicEl = root.querySelector('#dynamic-content').firstElementChild;
    if (dynamicEl && 'mode' in dynamicEl) {
      dynamicEl.mode = mode;
    }

    const statusSelect = root.querySelector('#detail-status');
    if (statusSelect) {
      statusSelect.mode = isProcess ? 'edit' : 'view';
    }

    const schoolSelect = root.querySelector('#detail-school');
    if (schoolSelect) {
      schoolSelect.mode = isEdit ? 'edit' : 'view';
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
    root.querySelector('#view-reqType').textContent = data.reqType || 'N/A';
    root.querySelector('#view-submitted').textContent = formatDate(data.submittedDate, 'MMM D, YYYY') || 'N/A';

    // View Mode Shared Fields
    const languages = [data.originalLanguage, data.targetLanguage].filter(Boolean).join(' to ');
    root.querySelector('#view-languages').textContent = languages || 'N/A';
    root.querySelector('#view-requester-name').textContent = data.name || 'N/A';

    const schoolSelect = root.querySelector('#detail-school');
    if (schoolSelect) {
      schoolSelect.value = data.school || '';
      schoolSelect.mode = this._mode;
    }

    root.querySelector('#view-description').textContent = data.description || 'No description provided.';

    // Edit Mode Shared Fields
    root.querySelector('#edit-requester-name').value = data.name || '';
    root.querySelector('#edit-orig-lang').value = data.originalLanguage || '';
    root.querySelector('#edit-target-lang').value = data.targetLanguage || '';
    root.querySelector('#edit-description').value = data.description || '';

    // Hydrate Approval Info
    root.querySelector('#detail-approved-by').textContent = data.approvedBy || 'N/A';
    root.querySelector('#detail-approved-date').textContent = data.approvedDate ? formatDate(data.approvedDate, 'MMM D, YYYY') : 'N/A';
    this.updateApprovalVisibility(data.status);

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

  updateApprovalVisibility(status) {
    const approvalInfo = this.shadowRoot.querySelector('#approval-info');
    if (approvalInfo) {
      approvalInfo.style.display = status !== 'Needs Approval' ? 'block' : 'none';
    }
  }
}

customElements.define('details-panel', DetailsPanel);