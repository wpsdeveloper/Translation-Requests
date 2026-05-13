// @ts-ignore
import statusColors from '../shared/StatusColors.css?inline';
// @ts-ignore
import sharedStyles from '../shared/SharedStyles.css?inline';
// @ts-ignore
import styles from './StatusSelect.css?inline';
// @ts-ignore
import template from './StatusSelect.htm?raw';
import '../StatusBadge/StatusBadge';

const sharedSheet = new CSSStyleSheet();
const colorSheet = new CSSStyleSheet();
const sheet = new CSSStyleSheet();

sharedSheet.replaceSync(sharedStyles);
colorSheet.replaceSync(statusColors);
sheet.replaceSync(styles);

class StatusSelect extends HTMLElement {
  static get observedAttributes() {
    return ['status', 'mode', 'disabled'];
  }

  private _status: string = '';
  private _mode: string = 'view';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, colorSheet, sheet];
    }
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'status') {
      this._status = newValue || '';
      this.updateView();
    } else if (name === 'mode') {
      this._mode = newValue || 'view';
      this.updateMode();
    } else if (name === 'disabled') {
      this.updateDisabled();
    }
  }

  get status() {
    return this._status;
  }

  set status(val: string) {
    this.setAttribute('status', val);
  }

  get mode() {
    return this._mode;
  }

  set mode(val: string) {
    this.setAttribute('mode', val);
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
    this.setupEventListeners();
    this.updateView();
    this.updateMode();
    this.updateDisabled();
  }

  setupEventListeners() {
    const select = this.shadowRoot?.querySelector('#status-dropdown') as HTMLSelectElement;
    select?.addEventListener('change', (e: any) => {
      this.status = e.target.value;
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { status: e.target.value },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  updateView() {
    const badge = this.shadowRoot?.querySelector('#status-badge');
    const select = this.shadowRoot?.querySelector('#status-dropdown') as HTMLSelectElement;

    if (badge) badge.setAttribute('status', this._status);
    if (select) select.value = this._status;
  }

  updateMode() {
    const viewEl = this.shadowRoot?.querySelector('#view-mode') as HTMLElement;
    const editEl = this.shadowRoot?.querySelector('#edit-mode') as HTMLElement;

    if (viewEl && editEl) {
      viewEl.style.display = this._mode === 'view' ? 'block' : 'none';
      editEl.style.display = this._mode === 'edit' ? 'block' : 'none';
    }
  }

  updateDisabled() {
    const select = this.shadowRoot?.querySelector('#status-dropdown') as HTMLSelectElement;
    if (select) {
      select.disabled = this.hasAttribute('disabled');
    }
  }
}

customElements.define('status-select', StatusSelect);

declare global {
  interface HTMLElementTagNameMap {
    'status-select': StatusSelect;
  }
}
