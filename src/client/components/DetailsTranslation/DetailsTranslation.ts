// @ts-ignore
import template from './DetailsTranslation.htm?raw';
import '../ContractorSelect/ContractorSelect';
import { PanelMode } from '../DetailsPanel/DetailsPanel';
import { DetailsBase } from '../shared/DetailsBase';

class DetailsTranslation extends DetailsBase {
  protected get template() {
    return template;
  }

  protected applyMode(root: ShadowRoot, value: PanelMode) {
    const isEdit = value === 'edit';
    const isProcess = value === 'process';

    // Fields above ContractorSelect (Edit mode)
    const editFields = ['#edit-document-length', '#edit-document-link'];
    const editViews = ['#view-document-length', '#view-document-link', '.file-link'];

    editFields.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isEdit ? 'block' : 'none';
    });
    editViews.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isEdit ? 'none' : '';
    });

    // Fields below and including ContractorSelect (Process mode)
    const processFields = ['#edit-date-sent', '#edit-date-received'];
    const processViews = ['#view-date-sent', '#view-date-received'];

    processFields.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isProcess ? 'block' : 'none';
    });
    processViews.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isProcess ? 'none' : '';
    });

    const contractorSelect = root.querySelector('#contractor-select') as any;
    if (contractorSelect) {
      contractorSelect.mode = isProcess ? 'edit' : 'view';
    }
  }

  protected hydrate(root: ShadowRoot) {
    // View Mode Hydration
    const viewLen = root.querySelector('#view-document-length');
    if (viewLen) viewLen.textContent = this._data.docPageCount || 'N/A';

    const viewLink = root.querySelector('#view-document-link') as HTMLAnchorElement;
    if (viewLink) {
      viewLink.href = this._data.docLink || '#';
      viewLink.style.display = this._data.docLink ? 'inline' : 'none';
    }

    // Formatting dates for view mode
    const sentDate = (this._data as any).docSentDate
      ? new Date((this._data as any).docSentDate).toLocaleDateString()
      : 'N/A';
    const receivedDate = (this._data as any).docReceivedDate
      ? new Date((this._data as any).docReceivedDate).toLocaleDateString()
      : 'N/A';

    const viewSent = root.querySelector('#view-date-sent');
    if (viewSent) viewSent.textContent = sentDate;

    const viewReceived = root.querySelector('#view-date-received');
    if (viewReceived) viewReceived.textContent = receivedDate;

    // Edit Mode Hydration
    const editLen = root.querySelector('#edit-document-length') as HTMLInputElement;
    if (editLen) editLen.value = this._data.docPageCount || '';

    const editLink = root.querySelector('#edit-document-link') as HTMLInputElement;
    if (editLink) editLink.value = this._data.docLink || '';

    // Date inputs expect YYYY-MM-DD
    const formatDateForInput = (date: any) => (date ? new Date(date).toISOString().split('T')[0] : '');
    const editSent = root.querySelector('#edit-date-sent') as HTMLInputElement;
    if (editSent) editSent.value = formatDateForInput((this._data as any).docSentDate);

    const editReceived = root.querySelector('#edit-date-received') as HTMLInputElement;
    if (editReceived) editReceived.value = formatDateForInput((this._data as any).docReceivedDate);

    const contractorSelect = root.querySelector('#contractor-select') as any;
    if (contractorSelect) {
      contractorSelect.value = {
        contractor: this._data.contractor,
        name: this._data.contractorName,
      };
      contractorSelect.mode = this._mode;
    }
  }

  getSaveData() {
    const root = this.shadowRoot;
    if (!root) return {};

    const contractorData = (root.querySelector('#contractor-select') as any)?.getSaveData() || {};

    return {
      docPageCount: (root.querySelector('#edit-document-length') as HTMLInputElement).value,
      docLink: (root.querySelector('#edit-document-link') as HTMLInputElement).value,
      docSentDate: (root.querySelector('#edit-date-sent') as HTMLInputElement).value,
      docReceivedDate: (root.querySelector('#edit-date-received') as HTMLInputElement).value,
      ...contractorData,
    };
  }
}

customElements.define('details-translation', DetailsTranslation);

declare global {
  interface HTMLElementTagNameMap {
    'details-translation': DetailsTranslation;
  }
}
