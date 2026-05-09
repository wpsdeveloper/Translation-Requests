import { store } from '../../services/state.js';
import { saveUserData } from '../../services/api.js';
import template from './UserEditor.htm?raw';
import styles from './UserEditor.css?inline';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class UserEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._user = null;
    this._isEdit = false;
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    
    // Subscribe to store updates to populate schools when they are loaded
    let lastSchoolsCount = 0;
    store.subscribe((state) => {
      const schools = state.schools || [];
      if (schools.length !== lastSchoolsCount) {
        lastSchoolsCount = schools.length;
        this.populateSchools();
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = template;
    this.populateSchools();
  }

  populateSchools() {
    const list = this.shadowRoot.getElementById('schools-list');
    const state = store.getState();
    const schools = state.schools || [];
    const userSchools = this._user ? (this._user.schools || []) : [];

    if (!list) return;

    list.innerHTML = '';
    schools.forEach(school => {
      const isChecked = userSchools.includes(school);
      const label = document.createElement('label');
      label.className = 'school-checkbox';
      label.innerHTML = `
        <input type="checkbox" value="${school}" name="school" ${isChecked ? 'checked' : ''}>
        <span>${school}</span>
      `;
      list.appendChild(label);
    });
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('user-form');
    const overlay = this.shadowRoot.getElementById('editor-overlay');
    const closeBtn = this.shadowRoot.getElementById('close-modal');
    const cancelBtn = this.shadowRoot.getElementById('cancel-btn');
    const roleSelect = this.shadowRoot.getElementById('user-role');

    const close = () => {
      overlay.classList.remove('open');
      form.reset();
    };

    closeBtn.addEventListener('click', close);
    cancelBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    roleSelect.addEventListener('change', (e) => {
      this.toggleSchoolsVisibility(e.target.value);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveUser();
    });
  }

  toggleSchoolsVisibility(role) {
    const group = this.shadowRoot.getElementById('schools-group');
    if (role === 'Admin') {
      group.style.display = 'none';
    } else {
      group.style.display = 'block';
    }
  }

  open(user = null) {
    this._user = user;
    this._isEdit = !!user;
    
    const overlay = this.shadowRoot.getElementById('editor-overlay');
    const title = this.shadowRoot.getElementById('modal-title');
    const emailInput = this.shadowRoot.getElementById('user-email');
    const nameInput = this.shadowRoot.getElementById('user-name');
    const roleSelect = this.shadowRoot.getElementById('user-role');
    const checkboxes = this.shadowRoot.querySelectorAll('input[name="school"]');

    title.textContent = this._isEdit ? 'Edit User' : 'Add New User';
    emailInput.disabled = this._isEdit; // Email is the key, can't change it

    if (user) {
      emailInput.value = user.email;
      nameInput.value = user.name;
      roleSelect.value = user.role;
      
      const userSchools = user.schools || [];
      checkboxes.forEach(cb => {
        cb.checked = userSchools.includes(cb.value);
      });
      this.toggleSchoolsVisibility(user.role);
    } else {
      emailInput.value = '';
      nameInput.value = '';
      roleSelect.value = 'User';
      checkboxes.forEach(cb => cb.checked = false);
      this.toggleSchoolsVisibility('User');
    }

    overlay.classList.add('open');
  }

  async saveUser() {
    const form = this.shadowRoot.getElementById('user-form');
    const submitBtn = this.shadowRoot.getElementById('submit-btn');
    
    const email = this.shadowRoot.getElementById('user-email').value;
    const name = this.shadowRoot.getElementById('user-name').value;
    const role = this.shadowRoot.getElementById('user-role').value;
    const selectedSchools = Array.from(this.shadowRoot.querySelectorAll('input[name="school"]:checked'))
      .map(cb => cb.value);

    const userData = {
      ...(this._user || {}), // Preserve original keys (Row ID, etc.)
      email,
      name,
      role,
      schools: role === 'Admin' ? [] : selectedSchools
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
      const action = this._isEdit ? 'Edit' : 'Add';
      await saveUserData(userData, action);
      
      this.dispatchEvent(new CustomEvent('user-saved', {
        bubbles: true,
        composed: true
      }));
      
      this.shadowRoot.getElementById('editor-overlay').classList.remove('open');
      form.reset();
    } catch (err) {
      alert('Failed to save user: ' + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Save User';
    }
  }
}

customElements.define('user-editor', UserEditor);
