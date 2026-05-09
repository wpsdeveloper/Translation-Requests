import styles from './StatusMultiSelect.css?inline';
import template from './StatusMultiSelect.htm?raw';
import { store } from '../../services/state.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class StatusMultiSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._selectedValues = [];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Sync with store if needed
    const state = store.getState();
    if (state.filterStatuses) {
      this._selectedValues = [...state.filterStatuses];
      this.updateUI();
    }
  }

  render() {
    this.shadowRoot.innerHTML = template;
  }

  setupEventListeners() {
    const root = this.shadowRoot;
    const btn = root.getElementById('dropdown-btn');
    const container = root.querySelector('.multi-select-container');
    const checkboxes = root.querySelectorAll('input[type="checkbox"]');
    const menuItems = root.querySelectorAll('.menu-item');
    const selectAllBtn = root.getElementById('select-all-btn');
    const clearAllBtn = root.getElementById('clear-all-btn');

    // Toggle Dropdown
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      container.classList.toggle('open');
    });

    // Select All
    selectAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkboxes.forEach(cb => cb.checked = true);
      this.updateSelectedValues();
    });

    // Clear All
    clearAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      checkboxes.forEach(cb => cb.checked = false);
      this.updateSelectedValues();
    });

    // Close dropdown on outside click
    window.addEventListener('click', () => {
      container.classList.remove('open');
    });

    // Stop propagation inside menu to prevent closing
    root.querySelector('.dropdown-menu').addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Handle menu item clicks (to toggle checkbox when clicking the row)
    menuItems.forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const cb = item.querySelector('input');
          cb.checked = !cb.checked;
          cb.dispatchEvent(new Event('change'));
        }
      });
    });

    // Handle checkbox changes
    checkboxes.forEach(cb => {
      cb.addEventListener('change', () => {
        this.updateSelectedValues();
      });
    });
  }

  updateSelectedValues() {
    const root = this.shadowRoot;
    const checkboxes = root.querySelectorAll('input[type="checkbox"]');
    this._selectedValues = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    this.updateUI();
    
    // Update Global Store
    store.setState({ filterStatuses: this._selectedValues });
    
    // Dispatch local event
    this.dispatchEvent(new CustomEvent('change', {
      detail: { values: this._selectedValues },
      bubbles: true,
      composed: true
    }));
  }

  updateUI() {
    const root = this.shadowRoot;
    if (!root.getElementById('selected-text')) return; // Guard if called before render

    const text = root.getElementById('selected-text');
    const checkboxes = root.querySelectorAll('input[type="checkbox"]');

    // Update checkboxes
    checkboxes.forEach(cb => {
      cb.checked = this._selectedValues.includes(cb.value);
    });

    // Update button text
    if (this._selectedValues.length === 0) {
      text.textContent = 'All Statuses';
    } else if (this._selectedValues.length === 1) {
      text.textContent = this._selectedValues[0];
    } else if (this._selectedValues.length === checkboxes.length) {
      text.textContent = 'All Statuses';
    } else {
      text.textContent = `${this._selectedValues.length} Statuses`;
    }
  }
}

customElements.define('status-multi-select', StatusMultiSelect);
