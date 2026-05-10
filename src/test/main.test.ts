import { describe, it, expect, vi, beforeEach } from 'vitest';
import { store } from '../client/services/state';
import * as api from '../client/services/api';
import { App } from '../client/main';

describe('main.ts (App Integration)', () => {
  let app: App;

  beforeEach(async () => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="main-nav"></div>
      <button id="nav-users"></button>
      <button id="nav-dashboard"></button>
      <select id="school-filter"></select>
      <div id="dashboard-view"></div>
      <div id="users-view"></div>
      <details-panel></details-panel>
    `;

    // Mock api.fetchData
    vi.spyOn(api, 'fetchData').mockResolvedValue({
      requests: [],
      schools: ['School A'],
      user: { email: 'test@test.com', name: 'Test', role: 'Admin', schools: [] }
    });

    // Manually instantiate the app for testing
    app = new App();
  });

  it('should initialize data on startup', async () => {
    // Wait for any async init to finish
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(api.fetchData).toHaveBeenCalled();
    expect(store.getState().schools).toContain('School A');
  });

  it('should toggle views when navigation buttons are clicked', () => {
    const navUsers = document.getElementById('nav-users');
    navUsers?.click();

    expect(store.getState().activeView).toBe('users');

    const navDashboard = document.getElementById('nav-dashboard');
    navDashboard?.click();

    expect(store.getState().activeView).toBe('dashboard');
  });

  it('should close the details panel when clicking outside', () => {
    store.setState({ selectedRow: { id: '1' } as any });
    
    // Simulate clicking outside (on the body)
    // Note: main.ts uses window.addEventListener, which we've attached via setupEventListeners() in constructor
    window.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(store.getState().selectedRow).toBeNull();
  });
});
