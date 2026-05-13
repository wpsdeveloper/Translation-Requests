import { store } from '../../services/state';
import { saveUserData } from '../../services/api';
// @ts-ignore
import template from './UserEditor.htm?raw';
// @ts-ignore
import sharedStyles from '../shared/SharedStyles.css?inline';
// @ts-ignore
import styles from './UserEditor.css?inline';

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(sharedStyles);

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class UserEditor extends HTMLElement {
  private _user: AppUser | null = null;
  private _isEdit: boolean = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, sheet];
    }
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
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
    this.populateSchools();
  }

  populateSchools() {
    const list = this.shadowRoot?.getElementById('schools-list');
    const state = store.getState();
    const schools = state.schools || [];
    const userSchools = this._user ? this._user.schools || [] : [];

    if (!list) return;

    list.innerHTML = '';
    schools.forEach((school) => {
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
    const form = this.shadowRoot?.getElementById('user-form') as HTMLFormElement;
    const overlay = this.shadowRoot?.getElementById('editor-overlay') as HTMLElement;
    const closeBtn = this.shadowRoot?.getElementById('close-modal') as HTMLElement;
    const cancelBtn = this.shadowRoot?.getElementById('cancel-btn') as HTMLElement;
    const roleSelect = this.shadowRoot?.getElementById('user-role') as HTMLSelectElement;

    const close = () => {
      overlay.classList.remove('open');
      form.reset();
    };

    closeBtn?.addEventListener('click', close);
    cancelBtn?.addEventListener('click', close);
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    roleSelect?.addEventListener('change', (e: any) => {
      this.toggleSchoolsVisibility(e.target.value);
    });

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveUser();
    });
  }

  toggleSchoolsVisibility(role: string) {
    const group = this.shadowRoot?.getElementById('schools-group') as HTMLElement;
    if (group) {
      if (role === 'Admin') {
        group.style.display = 'none';
      } else {
        group.style.display = 'block';
      }
    }
  }

  open(user: AppUser | null = null) {
    this._user = user;
    this._isEdit = !!user;

    const overlay = this.shadowRoot?.getElementById('editor-overlay') as HTMLElement;
    const title = this.shadowRoot?.getElementById('modal-title') as HTMLElement;
    const emailInput = this.shadowRoot?.getElementById('user-email') as HTMLInputElement;
    const nameInput = this.shadowRoot?.getElementById('user-name') as HTMLInputElement;
    const roleSelect = this.shadowRoot?.getElementById('user-role') as HTMLSelectElement;
    const checkboxes = this.shadowRoot?.querySelectorAll('input[name="school"]') as NodeListOf<HTMLInputElement>;

    if (title) title.textContent = this._isEdit ? 'Edit User' : 'Add New User';
    if (emailInput) emailInput.disabled = this._isEdit; // Email is the key, can't change it

    if (user) {
      if (emailInput) emailInput.value = user.email;
      if (nameInput) nameInput.value = user.name;
      if (roleSelect) roleSelect.value = user.role;

      const userSchools = user.schools || [];
      checkboxes.forEach((cb) => {
        cb.checked = userSchools.includes(cb.value);
      });
      this.toggleSchoolsVisibility(user.role);
    } else {
      if (emailInput) emailInput.value = '';
      if (nameInput) nameInput.value = '';
      if (roleSelect) roleSelect.value = 'User';
      checkboxes.forEach((cb) => (cb.checked = false));
      this.toggleSchoolsVisibility('User');
    }

    overlay?.classList.add('open');
  }

  async saveUser() {
    const form = this.shadowRoot?.getElementById('user-form') as HTMLFormElement;
    const submitBtn = this.shadowRoot?.getElementById('submit-btn') as HTMLButtonElement;

    const email = (this.shadowRoot?.getElementById('user-email') as HTMLInputElement).value;
    const name = (this.shadowRoot?.getElementById('user-name') as HTMLInputElement).value;
    const role = (this.shadowRoot?.getElementById('user-role') as HTMLSelectElement).value;
    const selectedSchools = Array.from(
      this.shadowRoot?.querySelectorAll('input[name="school"]:checked') as NodeListOf<HTMLInputElement>
    ).map((cb) => cb.value);

    const userData: AppUser = {
      ...(this._user || ({} as AppUser)), // Preserve original keys (Row ID, etc.)
      email,
      name,
      role: role as any,
      schools: role === 'Admin' ? [] : selectedSchools,
    };

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';
    }

    try {
      const action = this._isEdit ? 'Edit' : 'Add';
      await saveUserData(userData, action);

      this.dispatchEvent(
        new CustomEvent('user-saved', {
          bubbles: true,
          composed: true,
        })
      );

      this.shadowRoot?.getElementById('editor-overlay')?.classList.remove('open');
      form.reset();
    } catch (err: any) {
      alert('Failed to save user: ' + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save User';
      }
    }
  }
}

customElements.define('user-editor', UserEditor);

declare global {
  interface HTMLElementTagNameMap {
    'user-editor': UserEditor;
  }
}
