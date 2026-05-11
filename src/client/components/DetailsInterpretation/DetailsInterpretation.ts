// @ts-ignore
import styles from '../shared/DetailsStyles.css?inline';
// @ts-ignore
import template from './DetailsInterpretation.htm?raw';
import '../ContractorSelect/ContractorSelect';
import { formatDate, formatTime } from '../../services/utils';
import { TranslationRequest } from '../../../shared/types';
import { PanelMode } from '../DetailsPanel/DetailsPanel';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DetailsInterpretation extends HTMLElement {
  private _data: TranslationRequest = {} as TranslationRequest;
  private _mode: PanelMode = 'view';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  set data(value: TranslationRequest) {
    this._data = value;
    this.render();
  }

  get mode(): PanelMode {
    return this._mode;
  }

  set mode(value: PanelMode) {
    this._mode = value;
    const root = this.shadowRoot;
    if (!root) return;

    const isEdit = value === 'edit';
    const isProcess = value === 'process';

    // Fields above ContractorSelect (Edit mode)
    const editFields = ['#edit-interpretation-type', '#edit-event-date', '.time-range', '#edit-event-location'];
    const editViews = ['#view-interpretation-type', '#view-event-date', '#view-event-time', '#view-event-location'];

    editFields.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isEdit ? (sel === '.time-range' ? 'flex' : 'block') : 'none';
    });
    editViews.forEach((sel) => {
      const el = root.querySelector(sel) as HTMLElement;
      if (el) el.style.display = isEdit ? 'none' : '';
    });

    // Fields below and including ContractorSelect (Process mode)
    const processFields = ['#edit-date-scheduled', '#edit-date-guest-confirmed', '#edit-date-tech-confirmed'];
    const processViews = ['#view-date-scheduled', '#view-date-guest-confirmed', '#view-date-tech-confirmed'];

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

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
    const root = this.shadowRoot;
    if (!root) return;

    this.viewModeHydration(root);
    this.editModeHydration(root);

    this.mode = this._mode;
  }

  private viewModeHydration(root: ShadowRoot) {
    const viewEventDate = root.querySelector('#view-event-date');
    if (viewEventDate)
      viewEventDate.textContent = this._data.requestDate ? formatDate(this._data.requestDate, 'MMM D, YYYY') : 'N/A';

    const startStr = this._data.startTime ? formatTime(this._data.startTime, 'h:mm A') : '';
    const endStr = this._data.endTime ? formatTime(this._data.endTime, 'h:mm A') : '';
    const viewEventTime = root.querySelector('#view-event-time');
    if (viewEventTime)
      viewEventTime.textContent = startStr && endStr ? `${startStr} to ${endStr}` : startStr || endStr || 'N/A';

    const viewEventLocation = root.querySelector('#view-event-location');
    if (viewEventLocation) viewEventLocation.textContent = this._data.eventLocation || 'N/A';

    const viewInterpType = root.querySelector('#view-interpretation-type');
    if (viewInterpType) viewInterpType.textContent = this._data.interpretationType || 'N/A';

    const viewScheduled = root.querySelector('#view-date-scheduled');
    if (viewScheduled)
      viewScheduled.textContent = (this._data as any).scheduledDate
        ? formatDate((this._data as any).scheduledDate, 'MMM D, YYYY')
        : 'N/A';

    const viewGuestConfirmed = root.querySelector('#view-date-guest-confirmed');
    if (viewGuestConfirmed)
      viewGuestConfirmed.textContent = (this._data as any).guestConfirmedDate
        ? formatDate((this._data as any).guestConfirmedDate, 'MMM D, YYYY')
        : 'N/A';

    const viewTechConfirmed = root.querySelector('#view-date-tech-confirmed');
    if (viewTechConfirmed)
      viewTechConfirmed.textContent = (this._data as any).techConfirmedDate
        ? formatDate((this._data as any).techConfirmedDate, 'MMM D, YYYY')
        : 'N/A';
  }

  private editModeHydration(root: ShadowRoot) {
    const formatDateForInput = (date: any) => (date ? new Date(date).toISOString().split('T')[0] : '');
    const formatTimeForInput = (date: any) => (date ? new Date(date).toTimeString().slice(0, 5) : '');

    const editEventDate = root.querySelector('#edit-event-date') as HTMLInputElement;
    if (editEventDate) editEventDate.value = formatDateForInput(this._data.requestDate);

    const editStartTime = root.querySelector('#edit-start-time') as HTMLInputElement;
    if (editStartTime) editStartTime.value = formatTimeForInput(this._data.startTime);

    const editEndTime = root.querySelector('#edit-end-time') as HTMLInputElement;
    if (editEndTime) editEndTime.value = formatTimeForInput(this._data.endTime);

    const editEventLocation = root.querySelector('#edit-event-location') as HTMLInputElement;
    if (editEventLocation) editEventLocation.value = this._data.eventLocation || '';

    const editInterpType = root.querySelector('#edit-interpretation-type') as HTMLInputElement;
    if (editInterpType) editInterpType.value = this._data.interpretationType || '';

    const editScheduled = root.querySelector('#edit-date-scheduled') as HTMLInputElement;
    if (editScheduled) editScheduled.value = formatDateForInput((this._data as any).scheduledDate);

    const editGuestConfirmed = root.querySelector('#edit-date-guest-confirmed') as HTMLInputElement;
    if (editGuestConfirmed) editGuestConfirmed.value = formatDateForInput((this._data as any).guestConfirmedDate);

    const editTechConfirmed = root.querySelector('#edit-date-tech-confirmed') as HTMLInputElement;
    if (editTechConfirmed) editTechConfirmed.value = formatDateForInput((this._data as any).techConfirmedDate);

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
      interpretationType: (root.querySelector('#edit-interpretation-type') as HTMLInputElement).value,
      requestDate: (root.querySelector('#edit-event-date') as HTMLInputElement).value,
      startTime: (root.querySelector('#edit-start-time') as HTMLInputElement).value,
      endTime: (root.querySelector('#edit-end-time') as HTMLInputElement).value,
      eventLocation: (root.querySelector('#edit-event-location') as HTMLInputElement).value,
      scheduledDate: (root.querySelector('#edit-date-scheduled') as HTMLInputElement).value,
      guestConfirmedDate: (root.querySelector('#edit-date-guest-confirmed') as HTMLInputElement).value,
      techConfirmedDate: (root.querySelector('#edit-date-tech-confirmed') as HTMLInputElement).value,
      ...contractorData,
    };
  }
}

customElements.define('details-interpretation', DetailsInterpretation);

declare global {
  interface HTMLElementTagNameMap {
    'details-interpretation': DetailsInterpretation;
  }
}
