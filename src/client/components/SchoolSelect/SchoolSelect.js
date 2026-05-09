import styles from './SchoolSelect.css?inline';
import sharedStyles from '../shared/DetailsStyles.css?inline';
import template from './SchoolSelect.htm?raw';
import { store } from '../../services/state.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedStyles);

class SchoolSelect extends HTMLElement {
  static get observedAttributes() {
    return ['mode', 'value', 'include-all'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sharedSheet, sheet];
    this._value = '';
    this._mode = 'view';
    this._schools = [];
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

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'mode') {
      this.mode = newValue;
    } else if (name === 'value') {
      this.value = newValue;
    } else if (name === 'include-all') {
      this.populateOptions();
    }
  }

  get value() {
    return this._value;
  }

  set value(val) {
    this._value = val;
    this.updateUI();
  }

  get mode() {
    return this._mode;
  }

  set mode(val) {
    this._mode = val;
    this.updateModeUI();
  }

  render() {
    this.shadowRoot.innerHTML = template;
    this.setupEventListeners();
    this.updateModeUI();
    this.updateUI();
  }

  setupEventListeners() {
    const select = this.shadowRoot.querySelector('#school-dropdown');
    select.addEventListener('change', (e) => {
      this._value = e.target.value;
      this.updateUI();
      this.dispatchEvent(new CustomEvent('change', {
        detail: { value: this._value },
        bubbles: true,
        composed: true
      }));
    });
  }

  populateOptions() {
    const select = this.shadowRoot.querySelector('#school-dropdown');
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
      schoolsToShow = this._schools.filter(school => userSchools.includes(school));
    }

    schoolsToShow.forEach(school => {
      const opt = document.createElement('option');
      opt.value = school;
      opt.textContent = school;
      select.appendChild(opt);
    });

    // add other option
    const opt = document.createElement('option');
    opt.value = "Other";
    opt.textContent = "Other";
    select.appendChild(opt);

    select.value = currentValue;
  }

  updateUI() {
    const root = this.shadowRoot;
    const viewVal = root.querySelector('#view-value');
    const select = root.querySelector('#school-dropdown');

    if (viewVal) viewVal.textContent = this._value || 'N/A';
    if (select) select.value = this._value;
  }

  updateModeUI() {
    const root = this.shadowRoot;
    const viewEl = root.querySelector('#view-mode');
    const editEl = root.querySelector('#edit-mode');

    if (viewEl && editEl) {
      viewEl.style.display = this._mode === 'view' ? '' : 'none';
      editEl.style.display = this._mode === 'edit' ? '' : 'none';
    }
  }
}

customElements.define('school-select', SchoolSelect);
