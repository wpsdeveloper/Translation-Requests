import { store } from '../../services/state';
import { formatDate, formatTime } from '../../services/utils';
import { saveRequest, deleteRequest } from '../../services/api';
import { TranslationRequest } from '../../../shared/types';
import { showToast, showModal } from '../../services/ui';

import panelTemplate from './DetailsPanel.htm?raw';
import sharedPanelStyles from '../shared/DetailsStyles.css?inline';
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

/**
 * DetailsPanel: A side panel that displays and allows editing of request details.
 * It uses a "Mode" system ('view', 'edit', 'process') to toggle between
 * different UI states and dynamically loads sub-components based on request type.
 */
class DetailsPanel extends HTMLElement {
  // UI state: 'view' (readonly), 'edit' (requester edit), 'process' (admin workflow)
  private _mode: PanelMode = 'view';

  // The current request data being displayed.
  private _data: TranslationRequest | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      // Use both shared and component-specific stylesheets for consistent UI.
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
      const target = e.target as HTMLElement;
      const path = e.composedPath() as HTMLElement[];

      if (target.id === 'process-btn') this.setMode('process');
      if (target.id === 'cancel-btn') this.cancelEdit();
      if (target.id === 'close-btn') this.handleClose();
      if (target.id === 'save-btn') this.onSave();

      if (path.some((el: any) => el.id === 'edit-btn')) this.handleEditToggle();
      if (path.some((el: any) => el.id === 'delete-btn')) this.onDelete();
    });

    this.shadowRoot?.addEventListener('change', (e: any) => {
      if (e.target.id === 'detail-status') {
        this.updateApprovalVisibility(e.detail.status);
      }
    });
  }

  private handleEditToggle() {
    const newMode = this._mode === 'edit' ? 'view' : 'edit';
    this.setMode(newMode);
    this.toggleButtons(this.shadowRoot!, newMode);
  }

  private handleClose() {
    store.setState({ selectedRow: null });
    this.setMode('view');
  }

  private cancelEdit() {
    this.setMode('view');
  }

  /**
   * Listens for store updates. When a row is selected in the store,
   * the panel automatically opens and hydrates itself with the data.
   */
  subscribeToStore() {
    store.subscribe((state) => {
      if (state.selectedRow) {
        this.hydrate(state.selectedRow);
        this.setMode('view');
        this.classList.add('open'); // Slide in the panel via CSS transition
      } else {
        this.classList.remove('open'); // Slide out the panel
      }
    });
  }

  setMode(mode: PanelMode) {
    this._mode = mode;
    const root = this.shadowRoot;
    if (!root) return;

    this.toggleButtons(root, mode);
    this.populateContent(root, mode);

    if (this._data) this.hydrate(this._data);
  }

  private populateContent(root: ShadowRoot, mode: string) {
    const isEdit = mode === 'edit';
    const isProcess = mode === 'process';

    this.toggleModeClasses(root, isEdit);
    this.syncDynamicComponent(root, mode);

    this.updateStatusSelect(root, isProcess);
    this.updateSchoolSelect(root, isEdit);
  }

  private toggleModeClasses(root: ShadowRoot, isEdit: boolean) {
    const viewEls = root.querySelectorAll('.view-mode');
    const editEls = root.querySelectorAll('.edit-mode');

    viewEls.forEach((el: any) => el.style.display = isEdit ? 'none' : '');
    editEls.forEach((el: any) => el.style.display = isEdit ? '' : 'none');
  }

  private syncDynamicComponent(root: ShadowRoot, mode: string) {
    const dynamicEl = root.querySelector('#dynamic-content')?.firstElementChild as any;
    if (dynamicEl && 'mode' in dynamicEl) {
      dynamicEl.mode = mode;
    }
  }

  private updateSchoolSelect(root: ShadowRoot, isEdit: boolean) {
    const schoolSelect = root.querySelector('#detail-school') as any;
    if (schoolSelect) {
      schoolSelect.mode = isEdit ? 'edit' : 'view';
    }
  }

  private updateStatusSelect(root: ShadowRoot, isProcess: boolean) {
    const statusSelect = root.querySelector('#detail-status') as any;
    const user = store.getState().user;

    if (statusSelect) {
      statusSelect.mode = isProcess ? 'edit' : 'view';
      // Disable status change for Users if it's currently Needs Approval
      const canApprove = user && ['Approver', 'Admin'].includes(user.role);
      const isNeedsApproval = this._data?.status === 'Needs Approval';
      if (!canApprove && isNeedsApproval) {
        statusSelect.setAttribute('disabled', 'true');
      } else {
        statusSelect.removeAttribute('disabled');
      }
    }
  }

  private toggleButtons(root: ShadowRoot, mode: string) {
    const isView = mode === 'view';
    const isEdit = mode === 'edit';
    const canApprove = this.canUserApprove();

    this.setVisibility(root, '#save-btn', !isView);
    this.setVisibility(root, '#cancel-btn', !isView);
    this.setVisibility(root, '#edit-btn', !isEdit);
    this.setVisibility(root, '#delete-btn', isEdit);

    this.setVisibility(root, '#approve-btn', !isEdit && canApprove);
    this.setVisibility(root, '#deny-btn', !isEdit && canApprove);

    this.updateProcessButton(root, isView);
  }

  private setVisibility(root: ShadowRoot, selector: string, visible: boolean) {
    const element = root.querySelector(selector) as HTMLElement;
    if (element) element.style.display = visible ? '' : 'none';
  }

  private canUserApprove() {
    const user = store.getState().user;
    const approvingRoles = ['Approver', 'Admin'];

    return Boolean(user && approvingRoles.includes(user.role));
  }

  private updateProcessButton(root: ShadowRoot, isView: boolean) {
    const processBtn = root.querySelector('#process-btn') as HTMLElement;
    if (!processBtn) return;

    processBtn.style.display = isView ? '' : 'none';

    this._data?.status === 'Needs Approval' ?
      processBtn.setAttribute('disabled', 'true') :
      processBtn.removeAttribute('disabled');
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

    this.hydrateViewFields(root, data);
    this.hydrateEditFields(root, data);
    this.hydrateApprovalSection(root, data);
    this.hydrateSpecializedSection(root, data);

    this.hydrateStatusSelect(root, data);
    this.hydrateSchoolSelect(root, data);

    this.injectDynamicContent(root, data);
  }

  private hydrateStatusSelect(root: ShadowRoot, data: TranslationRequest) {
    const statusSelect = root.querySelector('#detail-status') as any;
    if (statusSelect) {
      statusSelect.status = data.status;
      statusSelect.mode = this._mode;
    }
  }

  private hydrateSchoolSelect(root: ShadowRoot, data: TranslationRequest) {
    const schoolSelect = root.querySelector('#detail-school') as any;
    if (schoolSelect) {
      schoolSelect.value = data.school || '';
      schoolSelect.mode = this._mode;
    }
  }

  // Responsibility: Mapping data to read-only labels
  private hydrateViewFields(root: ShadowRoot, data: TranslationRequest) {
    this.setSafeText(root, '#view-reqType', data.reqType);
    this.setSafeText(root, '#view-submitted', formatDate(data.submittedDate, 'MMM D, YYYY'));
    this.setSafeText(root, '#view-requester-name', data.name);
    this.setSafeText(root, '#view-description', data.description, 'No description provided.');

    const langs = [data.originalLanguage, data.targetLanguage].filter(Boolean).join(' to ');
    this.setSafeText(root, '#view-languages', langs);
  }

  // Responsibility: Mapping data to form inputs
  private hydrateEditFields(root: ShadowRoot, data: TranslationRequest) {
    this.setInputValue(root, '#edit-requester-name', data.name);
    this.setInputValue(root, '#edit-orig-lang', data.originalLanguage);
    this.setInputValue(root, '#edit-target-lang', data.targetLanguage);
    this.setInputValue(root, '#edit-description', data.description);
  }

  private hydrateApprovalSection(root: ShadowRoot, data: TranslationRequest) {
    // Hydrate Approval Info
    const approvedBy = root.querySelector('#detail-approved-by');
    if (approvedBy) approvedBy.textContent = (data as any).approvedBy || 'N/A';

    const approvedDate = root.querySelector('#detail-approved-date');
    if (approvedDate)
      approvedDate.textContent = data.approvedDate ? formatDate(data.approvedDate, 'MMM D, YYYY') : 'N/A';

    const approvedByLabel = root.querySelector('#approved-by-label');
    const approvedDateLabel = root.querySelector('#approved-date-label');

    if (data.status === 'Denied') {
      if (approvedByLabel) approvedByLabel.textContent = 'Denied By';
      if (approvedDateLabel) approvedDateLabel.textContent = 'Denied Date';
    } else {
      if (approvedByLabel) approvedByLabel.textContent = 'Approved By';
      if (approvedDateLabel) approvedDateLabel.textContent = 'Approved Date';
    }
    this.updateApprovalVisibility(data.status);
  }

  private hydrateSpecializedSection(root: ShadowRoot, data: TranslationRequest) {
    const interpretationType = root.querySelector('#interpretationType');
    if (interpretationType) interpretationType.textContent = data.interpretationType || 'N/A';

    const eventLocation = root.querySelector('#eventLocation');
    if (eventLocation) eventLocation.textContent = data.eventLocation || 'N/A';

    const startTime = root.querySelector('#startTime');
    if (startTime) startTime.textContent = data.startTime ? formatTime(data.startTime) : 'N/A';

    const endTime = root.querySelector('#endTime');
    if (endTime) endTime.textContent = data.endTime ? formatTime(data.endTime) : 'N/A';

    const docPageCount = root.querySelector('#docPageCount');
    if (docPageCount) docPageCount.textContent = data.docPageCount || 'N/A';

    const docLink = root.querySelector('#docLink');
    if (docLink) docLink.textContent = data.docLink || 'N/A';
  }

  private injectDynamicContent(root: ShadowRoot, data: TranslationRequest) {
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

  private updateApprovalVisibility(status: string) {
    const approvalInfo = this.shadowRoot?.querySelector('#approval-info') as HTMLElement;
    if (approvalInfo) {
      approvalInfo.style.display = status !== 'Needs Approval' ? 'block' : 'none';
    }
  }

  async onSave() {
    const root = this.shadowRoot;
    if (!this._data || !root) return;

    const updatedRequest = this.gatherFormData(root);

    await this.withLoadingState('#save-btn', async () => {
      try {
        const savedData = await saveRequest(updatedRequest);

        this.syncGlobalState(savedData);
        this.setMode('view');
      } catch (err) {
        console.error('Failed to save:', err);
        alert('Failed to save changes. Please try again.');
      }
    });
  }

  private gatherFormData(root: ShadowRoot): TranslationRequest {
    const dynamicEl = root.querySelector('#dynamic-content')?.firstElementChild as any;

    return {
      ...this._data!,
      name: this.getInputValue(root, '#edit-requester-name'),
      school: (root.querySelector('#detail-school') as any)?.value,
      originalLanguage: this.getInputValue(root, '#edit-orig-lang'),
      targetLanguage: this.getInputValue(root, '#edit-target-lang'),
      description: this.getInputValue(root, '#edit-description'),
      status: (root.querySelector('#detail-status') as any)?.status,
      ...(dynamicEl?.getSaveData() || {}),
    };
  }

  private async withLoadingState(selector: string, action: () => Promise<void>) {
    const btn = this.shadowRoot?.querySelector(selector) as HTMLButtonElement;
    if (!btn) return await action();

    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
      await action();
    } finally {
      btn.textContent = originalText;
      btn.disabled = false;
    }
  }

  // Responsibility: Updating the Store
  private syncGlobalState(savedData: TranslationRequest) {
    const { allRows } = store.getState();
    const updatedRows = allRows.map((row) => (row.id === savedData.id ? savedData : row));

    store.setState({
      allRows: updatedRows,
      selectedRow: savedData,
    });
  }

  // Utility for gathering
  private getInputValue(root: ShadowRoot, selector: string): string {
    return (root.querySelector(selector) as HTMLInputElement)?.value || '';
  }

  async onDelete() {
    const data = this._data;
    if (!data) return;

    showModal(
      "Confirm Deletion",
      `Are you sure you want to delete this ${data.reqType} request?`,
      () => this.performOptimisticDelete(data)
    );
  }

  private async performOptimisticDelete(data: TranslationRequest) {
    const previousRows = [...store.getState().allRows];

    this.applyDeleteToStore(data.id, null);
    this.setMode('view');
    showToast("Deleting request...");

    try {
      await deleteRequest(data);
      showToast("Request deleted successfully.");
    } catch (err) {
      this.handleDeleteError(err, previousRows, data);
    }
  }

  private applyDeleteToStore(id: string, selectedRow: TranslationRequest | null) {
    const { allRows } = store.getState();
    store.setState({
      allRows: allRows.filter((row) => row.id !== id),
      selectedRow: selectedRow,
    });
  }

  private handleDeleteError(err: any, backup: TranslationRequest[], originalItem: TranslationRequest) {
    console.error('Failed to delete:', err);

    // Rollback state
    store.setState({
      allRows: backup,
      selectedRow: originalItem,
    });

    this.setMode('edit');
    showToast("Error: Could not delete. Restoring data...", 5000);
  }

  private setSafeText(root: ShadowRoot, selector: string, val: any, fallback = 'N/A') {
    const el = root.querySelector(selector);
    if (el) el.textContent = val || fallback;
  }

  private setInputValue(root: ShadowRoot, selector: string, val: string | undefined | null) {
    const el = root.querySelector(selector) as HTMLInputElement | HTMLTextAreaElement;
    if (el) el.value = val || '';
  }
}

customElements.define('details-panel', DetailsPanel);

declare global {
  interface HTMLElementTagNameMap {
    'details-panel': DetailsPanel;
  }
}
