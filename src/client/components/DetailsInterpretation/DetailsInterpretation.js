import styles from '../shared/DetailsStyles.css?inline';
import template from './DetailsInterpretation.htm?raw';
import '../ContractorSelect/ContractorSelect.js';
import { formatDate, formatTime } from '../../services/utils.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DetailsInterpretation extends HTMLElement {
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
    const viewEls = root.querySelectorAll('.view-mode');
    const editEls = root.querySelectorAll('.edit-mode');

    viewEls.forEach(el => el.style.display = value === 'view' ? 'block' : 'none');
    editEls.forEach(el => el.style.display = value === 'edit' ? 'block' : 'none');

    const contractorSelect = root.querySelector('#contractor-select');
    if (contractorSelect) {
      contractorSelect.mode = value;
    }
  }

  render() {
    this.shadowRoot.innerHTML = template;
    const root = this.shadowRoot;

    // View Mode Hydration
    root.querySelector('#view-event-date').textContent = this._data.requestDate ? formatDate(this._data.requestDate, 'MMM D, YYYY') : 'N/A';

    const startStr = this._data.startTime ? formatTime(this._data.startTime, 'h:mm A') : '';
    const endStr = this._data.endTime ? formatTime(this._data.endTime, 'h:mm A') : '';
    root.querySelector('#view-event-time').textContent = startStr && endStr ? `${startStr} to ${endStr}` : (startStr || endStr || 'N/A');

    root.querySelector('#view-event-location').textContent = this._data.eventLocation || 'N/A';
    root.querySelector('#view-interpreter-type').textContent = this._data.interpreterType || 'N/A';

    root.querySelector('#view-date-scheduled').textContent = this._data.scheduledDate ? formatDate(this._data.scheduledDate, 'MMM D, YYYY') : 'N/A';
    root.querySelector('#view-date-guest-confirmed').textContent = this._data.guestConfirmedDate ? formatDate(this._data.guestConfirmedDate, 'MMM D, YYYY') : 'N/A';
    root.querySelector('#view-date-tech-confirmed').textContent = this._data.techConfirmedDate ? formatDate(this._data.techConfirmedDate, 'MMM D, YYYY') : 'N/A';

    // Edit Mode Hydration
    const formatDateForInput = (date) => date ? new Date(date).toISOString().split('T')[0] : '';
    const formatTimeForInput = (date) => date ? new Date(date).toTimeString().slice(0, 5) : '';

    root.querySelector('#edit-event-date').value = formatDateForInput(this._data.requestDate);
    root.querySelector('#edit-start-time').value = formatTimeForInput(this._data.startTime);
    root.querySelector('#edit-end-time').value = formatTimeForInput(this._data.endTime);
    root.querySelector('#edit-event-location').value = this._data.eventLocation || '';
    root.querySelector('#edit-interpreter-type').value = this._data.interpreterType || '';

    root.querySelector('#edit-date-scheduled').value = formatDateForInput(this._data.scheduledDate);
    root.querySelector('#edit-date-guest-confirmed').value = formatDateForInput(this._data.guestConfirmedDate);
    root.querySelector('#edit-date-tech-confirmed').value = formatDateForInput(this._data.techConfirmedDate);

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

customElements.define('details-interpretation', DetailsInterpretation);