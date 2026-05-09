import { store } from '../../services/state.js';
import { formatDate } from '../../services/utils.js';
import { saveRequest } from '../../services/api.js';
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
    this.setupEventListeners();
    this.subscribeToStore();
  }

  setupEventListeners() {
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
      if (e.target.id === 'save-btn') this.onSave();
    });

    this.shadowRoot.addEventListener('change', (e) => {
      if (e.target.id === 'detail-status') {
        this.updateApprovalVisibility(e.detail.status);
      }
    });
  }

  subscribeToStore() {
    store.subscribe((state) => {
      if (state.selectedRow) {
        this.hydrate(state.selectedRow);
        this.classList.add('open'); // Show panel
      } else {
        this.classList.remove('open'); // Hide panel
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
    const user = store.getState().user;
    const isUser = user && user.role === 'User';
    const isNeedsApproval = this._data?.status === 'Needs Approval';

    if (statusSelect) {
      statusSelect.mode = isProcess ? 'edit' : 'view';
      // Disable status change for Users if it's currently Needs Approval
      if (isUser && isNeedsApproval) {
        statusSelect.setAttribute('disabled', 'true');
      } else {
        statusSelect.removeAttribute('disabled');
      }
    }

    // Hide Process button for Users if the record is in Needs Approval status
    const processBtn = root.querySelector('#process-btn');
    if (processBtn) {
      processBtn.style.display = (isView && (!isUser || !isNeedsApproval)) ? 'inline-block' : 'none';
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
    this._data = data;
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
    if (data.status === "Denied") {
      root.querySelector('#approved-by-label').textContent = 'Denied By';
      root.querySelector('#approved-date-label').textContent = 'Denied Date';
    } else {
      root.querySelector('#approved-by-label').textContent = 'Approved By';
      root.querySelector('#approved-date-label').textContent = 'Approved Date';
    }
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

  async onSave() {
    if (!this._data) return;

    const root = this.shadowRoot;
    const dynamicEl = root.querySelector('#dynamic-content').firstElementChild;
    const childData = dynamicEl?.getSaveData() || {};

    const updatedRequest = {
      ...this._data,
      name: root.querySelector('#edit-requester-name').value,
      school: root.querySelector('#detail-school').value,
      originalLanguage: root.querySelector('#edit-orig-lang').value,
      targetLanguage: root.querySelector('#edit-target-lang').value,
      description: root.querySelector('#edit-description').value,
      status: root.querySelector('#detail-status').status,
      ...childData
    };

    const saveBtn = root.querySelector('#save-btn');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = 'Saving...';
    saveBtn.disabled = true;

    try {
      const savedData = await saveRequest(updatedRequest);

      const state = store.getState();
      const updatedRows = state.allRows.map((row) => (row.id === savedData.id ? savedData : row));

      store.setState({
        allRows: updatedRows,
        selectedRow: savedData,
      });

      this.setMode('view');
    } catch (err) {
      console.error('Failed to save:', err);
      alert('Failed to save changes. Please try again.');
    } finally {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }
  }
}

customElements.define('details-panel', DetailsPanel);