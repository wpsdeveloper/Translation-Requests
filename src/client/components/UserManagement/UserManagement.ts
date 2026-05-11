import { store } from '../../services/state';
import { fetchAllUsers, saveUserData } from '../../services/api';
import { AppUser } from '../../../shared/types';
// @ts-ignore
import template from './UserManagement.htm?raw';
// @ts-ignore
import styles from './UserManagement.css?inline';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class UserManagement extends HTMLElement {
  private _users: AppUser[] = [];
  private _searchTerm: string = '';

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.loadUsers();

    store.subscribe((state) => {
      if (state.activeView === 'users' && this._users.length === 0) {
        this.loadUsers();
      }
    });
  }

  async loadUsers() {
    const loadingEl = this.shadowRoot?.getElementById('loading-users');
    const tableEl = this.shadowRoot?.getElementById('users-table');

    if (loadingEl) loadingEl.style.display = 'block';
    if (tableEl) tableEl.style.opacity = '0.5';

    try {
      const users = await fetchAllUsers();
      this._users = users;
      store.setState({ allUsers: users });
      this.updateTable();
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      if (loadingEl) loadingEl.style.display = 'none';
      if (tableEl) tableEl.style.opacity = '1';
    }
  }

  setupEventListeners() {
    const searchInput = this.shadowRoot?.getElementById('user-search') as HTMLInputElement;
    searchInput?.addEventListener('input', (e: any) => {
      this._searchTerm = e.target.value.toLowerCase();
      this.updateTable();
    });

    const addUserBtn = this.shadowRoot?.getElementById('add-user-btn') as HTMLElement;
    addUserBtn?.addEventListener('click', () => {
      const editor = this.shadowRoot?.getElementById('user-editor-modal') as any;
      editor?.open(null); // Open for new user
    });

    this.shadowRoot?.addEventListener('click', (e: any) => {
      const editBtn = e.target.closest('.edit-btn');
      const deleteBtn = e.target.closest('.delete-btn');

      if (editBtn) {
        const email = editBtn.dataset.email;
        const user = this._users.find((u) => u.email === email);
        const editor = this.shadowRoot?.getElementById('user-editor-modal') as any;
        if (user && editor) editor.open(user);
      }

      if (deleteBtn) {
        const email = deleteBtn.dataset.email;
        if (confirm(`Are you sure you want to delete user ${email}?`)) {
          this.deleteUser(email);
        }
      }
    });

    // Listen for saved users from the editor
    this.shadowRoot?.addEventListener('user-saved', () => {
      this.loadUsers();
    });
  }

  async deleteUser(email: string) {
    try {
      const user = this._users.find((u) => u.email === email);
      if (!user) return;
      console.log('Deleting user:', user);
      await saveUserData(user, 'Delete');
      this.loadUsers();
    } catch (err: any) {
      alert('Failed to delete user: ' + err.message);
    }
  }

  updateTable() {
    console.log('Updating users table with', this._users.length, 'users');
    const body = this.shadowRoot?.getElementById('users-body');
    const emptyState = this.shadowRoot?.getElementById('empty-users');

    if (!body) {
      console.error('Could not find users-body element');
      return;
    }

    const filteredUsers = this._users.filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(this._searchTerm) || email.includes(this._searchTerm);
    });

    body.innerHTML = '';

    if (filteredUsers.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    filteredUsers.forEach((user) => {
      const tr = document.createElement('tr');
      const schoolsList = Array.isArray(user.schools) ? user.schools.join(', ') : '';

      tr.innerHTML = `
        <td><strong>${user.name || 'Unknown'}</strong></td>
        <td>${user.email || 'N/A'}</td>
        <td><span class="role-badge role-${user.role}">${user.role || 'User'}</span></td>
        <td>${schoolsList || '<em>All Schools</em>'}</td>
        <td class="actions-col">
          <button class="action-btn edit-btn" data-email="${user.email}" title="Edit User">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4L18.5 2.5z"></path></svg>
          </button>
          <button class="action-btn delete-btn delete" data-email="${user.email}" title="Delete User">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </td>
      `;
      body.appendChild(tr);
    });
  }

  render() {
    console.log('Rendering UserManagement component');
    if (!template) {
      console.error('UserManagement template is missing!');
      if (this.shadowRoot) this.shadowRoot.innerHTML = '<h2>Error: Template not found</h2>';
      return;
    }
    if (this.shadowRoot) this.shadowRoot.innerHTML = template;
  }
}

customElements.define('user-management', UserManagement);

declare global {
  interface HTMLElementTagNameMap {
    'user-management': UserManagement;
  }
}
