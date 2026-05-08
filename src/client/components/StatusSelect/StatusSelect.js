import styles from './StatusSelect.css?inline';
import template from './StatusSelect.htm?raw';
import statusColors from '../shared/StatusColors.css?inline';
import '../StatusBadge/StatusBadge.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const colorSheet = new CSSStyleSheet();
colorSheet.replaceSync(statusColors);

class StatusSelect extends HTMLElement {
  static get observedAttributes() {
    return ['status', 'mode'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet, colorSheet];
    this._status = '';
    this._mode = 'view';
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'status') {
      this._status = newValue;
      this.updateView();
    } else if (name === 'mode') {
      this._mode = newValue;
      this.updateMode();
    }
  }

  get status() {
    return this._status;
  }

  set status(val) {
    this.setAttribute('status', val);
  }

  get mode() {
    return this._mode;
  }

  set mode(val) {
    this.setAttribute('mode', val);
  }

  render() {
    this.shadowRoot.innerHTML = template;
    this.setupEventListeners();
    this.updateView();
    this.updateMode();
  }

  setupEventListeners() {
    const select = this.shadowRoot.querySelector('#status-dropdown');
    select.addEventListener('change', (e) => {
      this.status = e.target.value;
      this.dispatchEvent(new CustomEvent('change', {
        detail: { status: e.target.value },
        bubbles: true,
        composed: true
      }));
    });
  }

  updateView() {
    const badge = this.shadowRoot.querySelector('#status-badge');
    const select = this.shadowRoot.querySelector('#status-dropdown');
    
    if (badge) badge.setAttribute('status', this._status);
    if (select) select.value = this._status;
  }

  updateMode() {
    const viewEl = this.shadowRoot.querySelector('#view-mode');
    const editEl = this.shadowRoot.querySelector('#edit-mode');
    
    if (viewEl && editEl) {
      viewEl.style.display = this._mode === 'view' ? 'block' : 'none';
      editEl.style.display = this._mode === 'edit' ? 'block' : 'none';
    }
  }
}

customElements.define('status-select', StatusSelect);
