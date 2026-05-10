import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/UserEditor/UserEditor';
import { AppUser } from '../shared/types';
import { store } from '../client/services/state';

describe('UserEditor', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ schools: ['School A', 'School B'] });
  });

  it('should populate fields when opening for edit', () => {
    const editor = document.createElement('user-editor') as any;
    container.appendChild(editor);

    const mockUser: AppUser = {
      email: 'edit@test.com',
      name: 'Edit User',
      role: 'Admin',
      schools: ['School A']
    };

    editor.open(mockUser);

    const root = editor.shadowRoot;
    expect(root.querySelector('#user-email').value).toBe('edit@test.com');
    expect(root.querySelector('#user-name').value).toBe('Edit User');
    expect(root.querySelector('#user-role').value).toBe('Admin');
  });

  it('should open the overlay when open() is called', () => {
    const editor = document.createElement('user-editor') as any;
    container.appendChild(editor);

    editor.open(null);

    const overlay = editor.shadowRoot.querySelector('#editor-overlay');
    expect(overlay.classList.contains('open')).toBe(true);
  });
});
