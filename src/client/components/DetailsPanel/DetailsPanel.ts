import { store } from '../../services/state';
import { formatDate, formatTime } from '../../services/utils';

import { showToast, showModal } from '../../services/ui';
import { requestActions } from '../../services/actions';
import panelTemplate from './DetailsPanel.htm?raw';

import sharedPanelStyles from '../shared/SharedStyles.css?inline';
import panelStyles from './DetailsPanel.css?inline';
import detailsStyles from '../shared/DetailsStyles.css?inline';

import '../DetailsInterpretation/DetailsInterpretation';
import '../DetailsTranslation/DetailsTranslation';
import '../StatusSelect/StatusSelect';
import '../SchoolSelect/SchoolSelect';

import { DetailsBase } from '../shared/DetailsBase';

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedPanelStyles);

const detailsSheet = new CSSStyleSheet();
detailsSheet.replaceSync(detailsStyles);

const panelSheet = new CSSStyleSheet();
panelSheet.replaceSync(panelStyles);

export type PanelMode = 'view' | 'edit' | 'process';

/**
 * DetailsPanel: A side panel that displays and allows editing of request details.
 * It uses a "Mode" system ('view', 'edit', 'process') to toggle between
 * different UI states and dynamically loads sub-components based on request type.
 */
class DetailsPanel extends DetailsBase {
  protected get template() {
    return panelTemplate;
  }

  constructor() {
    super();
    if (this.shadowRoot) {
      // Use both shared and component-specific stylesheets for consistent UI.
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, detailsSheet, panelSheet];
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.subscribeToStore();
  }

  setupEventListeners() {
    const root = this.shadowRoot;
    if (!root) return;

    this.setupBaseListeners(root);

    root.addEventListener('click', (e: any) => {
      const target = e.target as HTMLElement;
      const path = e.composedPath() as HTMLElement[];

      if (target.id === 'process-btn') this.setMode('process');
      if (target.id === 'cancel-btn') this.cancelEdit();
      if (target.id === 'save-btn') this.onSave();
      if (target.id === 'close-btn') this.onClose();
      if (target.id === 'delete-btn') this.onDelete();

      if (path.some((el: any) => el.id === 'edit-btn')) this.handleEditToggle();
    });

    root.addEventListener('change', (e: any) => {
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

  protected onClose() {
    // Only update store if we are actually clearing a selection
    if (store.getState().selectedRow !== null) {
      store.setState({ selectedRow: null });
    }
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
        this.data = state.selectedRow;
        this.setMode('view');
        this.open = true;
      } else {
        this.open = false;
      }
    });
  }

  setMode(mode: PanelMode) {
    this.mode = mode; // Uses DetailsBase setter which calls applyMode()
  }

  protected applyMode(root: ShadowRoot, mode: PanelMode) {
    this.toggleButtons(root, mode);
    this.populateContent(root, mode);

    if (this._data) this.hydrate(root);
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

    viewEls.forEach((el: any) => (el.style.display = isEdit ? 'none' : ''));
    editEls.forEach((el: any) => (el.style.display = isEdit ? '' : 'none'));
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

    this.updateApproveDenyButtons(root, isView, isEdit, canApprove);
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

    const needsApproval = this._data?.status === 'Needs Approval';

    processBtn.style.display = isView && !needsApproval ? '' : 'none';

    needsApproval ? processBtn.setAttribute('disabled', 'true') : processBtn.removeAttribute('disabled');
  }

  private updateApproveDenyButtons(root: ShadowRoot, isView: boolean, isEdit: boolean, canApprove: boolean) {
    const approveBtn = root.querySelector('#approve-btn') as HTMLElement;
    const denyBtn = root.querySelector('#deny-btn') as HTMLElement;
    if (!approveBtn || !denyBtn) return;

    const needsApproval = this._data?.status === 'Needs Approval';

    approveBtn.style.display = isView && !isEdit && canApprove && needsApproval ? '' : 'none';
    denyBtn.style.display = isView && !isEdit && canApprove && needsApproval ? '' : 'none';
  }

  hydrate(root: ShadowRoot) {
    if (!this._data) return;

    // Call base auto-hydration for [data-bind] fields
    this.autoHydrate(root);

    // Handle compound fields not covered by simple data-bind
    const langs = [this._data.originalLanguage, this._data.targetLanguage].filter(Boolean).join(' to ');
    this.setSafeText(root, '#view-languages', langs);

    this.hydrateApprovalSection(root, this._data);
    this.hydrateStatusSelect(root, this._data);
    this.hydrateSchoolSelect(root, this._data);

    this.injectDynamicContent(root, this._data);
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
        await requestActions.save(updatedRequest);
        this.setMode('view');
      } catch (err) {
        // Error is handled by the service (toasts/logs)
      }
    });
  }

  private gatherFormData(root: ShadowRoot): TranslationRequest {
    const dynamicEl = root.querySelector('#dynamic-content')?.firstElementChild as any;

    return {
      ...this._data!,
      ...this.getSaveData(), // Automatically gathers all data-bind fields
      school: (root.querySelector('#detail-school') as any)?.value,
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

  // --- Actions ---

  async onDelete() {
    const data = this._data;
    if (!data) return;

    showModal('Confirm Deletion', `Are you sure you want to delete this ${data.reqType} request?`, async () => {
      try {
        await requestActions.delete(data);
        this.setMode('view');
      } catch (err) {
        // Error is handled by the service (toasts/logs)
        this.setMode('edit');
      }
    });
  }

  // --- Utilities ---

  private setSafeText(root: ShadowRoot, selector: string, val: any, fallback = '') {
    const el = root.querySelector(selector);
    if (el) el.textContent = val || fallback;
  }
}

customElements.define('details-panel', DetailsPanel);

declare global {
  interface HTMLElementTagNameMap {
    'details-panel': DetailsPanel;
  }
}
