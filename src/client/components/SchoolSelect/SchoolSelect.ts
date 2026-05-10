// @ts-ignore
import styles from './SchoolSelect.css?inline';
// @ts-ignore
import sharedStyles from '../shared/DetailsStyles.css?inline';
// @ts-ignore
import template from './SchoolSelect.htm?raw';
import { store } from '../../services/state';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedStyles);

class SchoolSelect extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'value', 'include-all'];
  }

  private _value: string = '';
  private _mode: string = 'view';
  private _schools: string[] = [];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, sheet];
    }
  }

  connectedCallback() {
    this.render();
    store.subscribe((state) => {
      if (JSON.stringify(this._schools) !== JSON.stringify(state.schools)) {
        this._schools = state.schools;
        this.populateOptions();
      }
    });
    // Initial population if schools already in store
    const state = store.getState();
    if (state.schools.length > 0) {
      this._schools = state.schools;
      this.populateOptions();
    }
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'mode') {
      this.mode = newValue || 'view';
    } else if (name === 'value') {
      this.value = newValue || '';
    } else if (name === 'include-all') {
      this.populateOptions();
    }
  }

  get value() {
    return this._value;
  }

  set value(val: string) {
    this._value = val;
    this.updateUI();
  }

  get mode() {
    return this._mode;
  }

  set mode(val: string) {
    this._mode = val;
    this.updateModeUI();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
    this.setupEventListeners();
    this.updateModeUI();
    this.updateUI();
  }

  setupEventListeners() {
    const select = this.shadowRoot?.querySelector('#school-dropdown') as HTMLSelectElement;
    select?.addEventListener('change', (e: any) => {
      this._value = e.target.value;
      this.updateUI();
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: { value: this._value },
          bubbles: true,
          composed: true,
        })
      );
    });
  }

  populateOptions() {
    const select = this.shadowRoot?.querySelector('#school-dropdown') as HTMLSelectElement;
    if (!select) return;

    const currentValue = this._value;
    select.innerHTML = '';

    if (this.hasAttribute('include-all')) {
      const allOption = document.createElement('option');
      allOption.value = '';
      allOption.textContent = 'All Schools';
      select.appendChild(allOption);
    } else {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'Select a school';
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);
    }

    const state = store.getState();
    const user = state.user;
    const isFilter = this.id === 'school-filter';

    let schoolsToShow = this._schools;

    // If it's the main filter and not an admin, restrict the schools shown
    if (isFilter && user && user.role !== 'Admin') {
      const userSchools = user.schools || [];
      schoolsToShow = this._schools.filter((school) => userSchools.includes(school));
    }

    schoolsToShow.forEach((school) => {
      const opt = document.createElement('option');
      opt.value = school;
      opt.textContent = school;
      select.appendChild(opt);
    });

    // add other option
    const opt = document.createElement('option');
    opt.value = 'Other';
    opt.textContent = 'Other';
    select.appendChild(opt);

    select.value = currentValue;
  }

  updateUI() {
    const root = this.shadowRoot;
    const viewVal = root?.querySelector('#view-value');
    const select = root?.querySelector('#school-dropdown') as HTMLSelectElement;

    if (viewVal) viewVal.textContent = this._value || 'N/A';
    if (select) select.value = this._value;
  }

  updateModeUI() {
    const root = this.shadowRoot;
    const viewEl = root?.querySelector('#view-mode') as HTMLElement;
    const editEl = root?.querySelector('#edit-mode') as HTMLElement;

    if (viewEl && editEl) {
      viewEl.style.display = this._mode === 'view' ? '' : 'none';
      editEl.style.display = this._mode === 'edit' ? '' : 'none';
    }
  }
}

customElements.define('school-select', SchoolSelect);

declare global {
  interface HTMLElementTagNameMap {
    'school-select': SchoolSelect;
  }
}
