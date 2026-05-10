import { store } from '../../services/state';
import { formatDate } from '../../services/utils';
import { saveRequest } from '../../services/api';
import { TranslationRequest } from '../../../shared/types';
// @ts-ignore
import panelTemplate from './DetailsPanel.htm?raw';
// @ts-ignore
import sharedPanelStyles from '../shared/DetailsStyles.css?inline';
// @ts-ignore
import panelStyles from './DetailsPanel.css?inline';

import '../DetailsInterpretation/DetailsInterpretation';
import '../DetailsTranslation/DetailsTranslation';
import '../StatusSelect/StatusSelect';
import '../SchoolSelect/SchoolSelect';

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedPanelStyles);

const panelSheet = new CSSStyleSheet();
panelSheet.replaceSync(panelStyles);

export type PanelMode = 'view' | 'edit' | 'process';

class DetailsPanel extends HTMLElement {
  private _mode: PanelMode = 'view';
  private _data: TranslationRequest | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, panelSheet];
    }
  }

  get mode(): PanelMode {
    return this._mode;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.subscribeToStore();
  }

  setupEventListeners() {
    this.shadowRoot?.addEventListener('click', (e: any) => {
      if (e.target.id === 'close-btn') {
        store.setState({ selectedRow: null });
        this.setMode('view');
      }
      if (e.composedPath().some((el: any) => el.id === 'edit-btn')) {
        this.setMode(this._mode === 'edit' ? 'view' : 'edit');
      }
      if (e.target.id === 'process-btn') this.setMode('process');
      if (e.target.id === 'cancel-btn') this.setMode('view');
      if (e.target.id === 'save-btn') this.onSave();
    });

    this.shadowRoot?.addEventListener('change', (e: any) => {
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

  setMode(mode: PanelMode) {
    this._mode = mode;
    const root = this.shadowRoot;
    if (!root) return;

    const isEdit = mode === 'edit';
    const isProcess = mode === 'process';
    const isView = mode === 'view';

    const processBtn = root.querySelector('#process-btn') as HTMLElement;
    const saveBtn = root.querySelector('#save-btn') as HTMLElement;
    const cancelBtn = root.querySelector('#cancel-btn') as HTMLElement;

    if (processBtn) processBtn.style.display = isView ? 'inline-block' : 'none';
    if (saveBtn) saveBtn.style.display = !isView ? 'inline-block' : 'none';
    if (cancelBtn) cancelBtn.style.display = !isView ? 'inline-block' : 'none';

    // Toggle shared view/edit elements (only in 'edit' mode)
    const sharedViewEls = root.querySelectorAll('.shared-meta .view-mode, .detail-item .view-mode');
    const sharedEditEls = root.querySelectorAll('.shared-meta .edit-mode, .detail-item .edit-mode');

    sharedViewEls.forEach((el: any) => (el.style.display = isEdit ? 'none' : ''));
    sharedEditEls.forEach((el: any) => (el.style.display = isEdit ? '' : 'none'));

    // Notify the dynamic component
    const dynamicEl = root.querySelector('#dynamic-content')?.firstElementChild as any;
    if (dynamicEl && 'mode' in dynamicEl) {
      dynamicEl.mode = mode;
    }

    const statusSelect = root.querySelector('#detail-status') as any;
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
    if (processBtn) {
      processBtn.style.display = (isView && (!isUser || !isNeedsApproval)) ? 'inline-block' : 'none';
    }

    const schoolSelect = root.querySelector('#detail-school') as any;
    if (schoolSelect) {
      schoolSelect.mode = isEdit ? 'edit' : 'view';
    }
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = panelTemplate;
    }
  }

  hydrate(data: TranslationRequest) {
    this._data = data;
    const root = this.shadowRoot;
    if (!root) return;

    // 1. Hydrate Shared Fields
    const statusSelect = root.querySelector('#detail-status') as any;
    if (statusSelect) {
      statusSelect.status = data.status;
      statusSelect.mode = this._mode;
    }
    const viewReqType = root.querySelector('#view-reqType');
    if (viewReqType) viewReqType.textContent = data.reqType || 'N/A';
    
    const viewSubmitted = root.querySelector('#view-submitted');
    if (viewSubmitted) viewSubmitted.textContent = formatDate(data.submittedDate, 'MMM D, YYYY') || 'N/A';

    // View Mode Shared Fields
    const languages = [data.originalLanguage, data.targetLanguage].filter(Boolean).join(' to ');
    const viewLanguages = root.querySelector('#view-languages');
    if (viewLanguages) viewLanguages.textContent = languages || 'N/A';
    
    const viewRequesterName = root.querySelector('#view-requester-name');
    if (viewRequesterName) viewRequesterName.textContent = data.name || 'N/A';

    const schoolSelect = root.querySelector('#detail-school') as any;
    if (schoolSelect) {
      schoolSelect.value = data.school || '';
      schoolSelect.mode = this._mode;
    }

    const viewDescription = root.querySelector('#view-description');
    if (viewDescription) viewDescription.textContent = data.description || 'No description provided.';

    // Edit Mode Shared Fields
    const editName = root.querySelector('#edit-requester-name') as HTMLInputElement;
    if (editName) editName.value = data.name || '';
    
    const editOrigLang = root.querySelector('#edit-orig-lang') as HTMLInputElement;
    if (editOrigLang) editOrigLang.value = data.originalLanguage || '';
    
    const editTargetLang = root.querySelector('#edit-target-lang') as HTMLInputElement;
    if (editTargetLang) editTargetLang.value = data.targetLanguage || '';
    
    const editDescription = root.querySelector('#edit-description') as HTMLTextAreaElement;
    if (editDescription) editDescription.value = data.description || '';

    // Hydrate Approval Info
    const approvedBy = root.querySelector('#detail-approved-by');
    if (approvedBy) approvedBy.textContent = (data as any).approvedBy || 'N/A';
    
    const approvedDate = root.querySelector('#detail-approved-date');
    if (approvedDate) approvedDate.textContent = data.approvedDate ? formatDate(data.approvedDate, 'MMM D, YYYY') : 'N/A';
    
    const approvedByLabel = root.querySelector('#approved-by-label');
    const approvedDateLabel = root.querySelector('#approved-date-label');
    
    if (data.status === "Denied") {
      if (approvedByLabel) approvedByLabel.textContent = 'Denied By';
      if (approvedDateLabel) approvedDateLabel.textContent = 'Denied Date';
    } else {
      if (approvedByLabel) approvedByLabel.textContent = 'Approved By';
      if (approvedDateLabel) approvedDateLabel.textContent = 'Approved Date';
    }
    this.updateApprovalVisibility(data.status);

    // 2. Hydrate Dynamic Content
    const container = root.querySelector('#dynamic-content');
    if (container) {
      container.innerHTML = ''; // Clear previous view

      let featureEl: any;
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

  updateApprovalVisibility(status: string) {
    const approvalInfo = this.shadowRoot?.querySelector('#approval-info') as HTMLElement;
    if (approvalInfo) {
      approvalInfo.style.display = status !== 'Needs Approval' ? 'block' : 'none';
    }
  }

  async onSave() {
    if (!this._data) return;

    const root = this.shadowRoot;
    if (!root) return;

    const dynamicEl = root.querySelector('#dynamic-content')?.firstElementChild as any;
    const childData = dynamicEl?.getSaveData() || {};

    const updatedRequest: TranslationRequest = {
      ...this._data,
      name: (root.querySelector('#edit-requester-name') as HTMLInputElement).value,
      school: (root.querySelector('#detail-school') as any).value,
      originalLanguage: (root.querySelector('#edit-orig-lang') as HTMLInputElement).value,
      targetLanguage: (root.querySelector('#edit-target-lang') as HTMLInputElement).value,
      description: (root.querySelector('#edit-description') as HTMLTextAreaElement).value,
      status: (root.querySelector('#detail-status') as any).status,
      ...childData
    };

    const saveBtn = root.querySelector('#save-btn') as HTMLButtonElement;
    if (!saveBtn) return;
    
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

declare global {
  interface HTMLElementTagNameMap {
    'details-panel': DetailsPanel;
  }
}
