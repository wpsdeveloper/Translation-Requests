import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/UserManagement/UserManagement';
import { store } from '../client/services/state';
import { AppUser } from '../shared/types';

describe('UserManagement', () => {
  let container: HTMLElement;
  const mockUsers: AppUser[] = [
    { email: 'admin@test.com', name: 'Admin User', role: 'Admin', schools: [] },
    { email: 'user@test.com', name: 'Standard User', role: 'User', schools: ['School A'] }
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ allUsers: [] });
  });

  it('should render the user list correctly', () => {
    const mgmt = document.createElement('user-management') as any;
    container.appendChild(mgmt);

    // Directly set internal users to bypass async fetch in this test
    mgmt._users = mockUsers;
    mgmt.updateTable();

    const rows = mgmt.shadowRoot.querySelectorAll('#users-body tr');
    expect(rows.length).toBe(2);
    expect(mgmt.shadowRoot.textContent).toContain('Admin User');
    expect(mgmt.shadowRoot.textContent).toContain('user@test.com');
  });

  it('should open user editor when "Add User" is clicked', () => {
    const mgmt = document.createElement('user-management') as any;
    container.appendChild(mgmt);

    const addBtn = mgmt.shadowRoot.querySelector('#add-user-btn');
    expect(addBtn).toBeTruthy();
    
    // Mock the editor's open method
    const editor = mgmt.shadowRoot.querySelector('#user-editor-modal');
    editor.open = vi.fn();
    
    addBtn.click();

    expect(editor.open).toHaveBeenCalledWith(null);
  });
});
