import { store } from './services/state';
import { fetchData } from './services/api';
// We don't need .js extension in imports for Vite when using TS
import './components/RequestsTable/RequestsTable';
import './components/DetailsPanel/DetailsPanel';
import './components/StatusMultiSelect/StatusMultiSelect';
import './components/UserManagement/UserManagement';
import './components/UserEditor/UserEditor';
import './components/NewRequestEntry/NewRequestEntry';
import './components/RequestsDashboard/RequestsDashboard';

/**
 * Main Application Orchestrator
 */
export class App {
  constructor() {
    this.init();
    this.setupEventListeners();
  }

  /**
   * Initializes the application state by fetching data from the server.
   */
  async init() {
    // 1. Set initial loading state
    store.setState({ allRows: [], loading: true });

    try {
      // 2. Fetch the data (either mock or GAS)
      const { requests, schools, user } = await fetchData();

      // Add views based on user role
      const viewContainer = document.getElementById('view-container');

      if (user && ['Admin'].includes(user.role) && viewContainer) {
        const userManagement = document.createElement('user-management');
        userManagement.style.display = 'none';
        viewContainer.appendChild(userManagement);
      }
      if (user && ['Admin', 'User'].includes(user.role) && viewContainer) {
        const dashboard = document.createElement('requests-dashboard');
        dashboard.style.display = 'none';
        viewContainer.appendChild(dashboard);
      }
      if (user && ['Admin', 'User', 'Guest'].includes(user.role) && viewContainer) {
        const newRequestEntry = document.createElement('new-request-entry');
        newRequestEntry.style.display = 'none';
        viewContainer.appendChild(newRequestEntry);
      }

      const defaultView = user && user.role === 'Guest' ? 'new-request-entry' : 'dashboard';

      // 3. Update the store
      store.setState({
        allRows: requests,
        schools: schools,
        user: user,
        loading: false,
        activeView: defaultView,
      });
      console.log('App initialized with user:', user);
    } catch (err: any) {
      console.error('Failed to load data:', err);
      store.setState({ loading: false });
    }
  }

  /**
   * Sets up global event listeners for the application.
   */
  setupEventListeners() {
    // 1. School Filter Synchronization
    const schoolFilter = document.getElementById('school-filter');
    if (schoolFilter) {
      schoolFilter.addEventListener('change', (e: any) => {
        store.setState({ filterSchool: e.detail.value });
      });
    }

    const navUsers = document.getElementById('nav-users');
    const navDashboard = document.getElementById('nav-dashboard');
    const navRequest = document.getElementById('nav-request');
    const mainNav = document.getElementById('main-nav');

    if (navUsers && navDashboard && navRequest) {
      navUsers.addEventListener('click', () => {
        store.setState({ activeView: 'users' });
      });
      navDashboard.addEventListener('click', () => {
        store.setState({ activeView: 'dashboard' });
      });
      navRequest.addEventListener('click', () => {
        store.setState({ activeView: 'new-request-entry' });
      });
    }

    // 4. Global Store Subscription for View Toggling
    store.subscribe((state) => {
      const { activeView, user } = state;

      // Toggle Navigation Visibility
      if (mainNav) {
        mainNav.style.display = user ? 'flex' : 'none';

        // Hide Restricted buttons for Guests
        if (navDashboard && navUsers) {
          const isGuest = user && user.role === 'Guest';
          navDashboard.style.display = isGuest ? 'none' : 'inline-block';
          navUsers.style.display = user && user.role === 'Admin' ? 'inline-block' : 'none';
        }
      }

      // Toggle Views
      const loadingView = document.getElementById('loading-view');
      const dashboardView = document.querySelector('requests-dashboard');
      const usersView = document.querySelector('user-management');
      const requestEntryView = document.querySelector('new-request-entry');
      const subtitle = document.getElementById('portal-subtitle');

      if (loadingView) {
        if (state.loading) {
          loadingView.style.display = 'block';
          loadingView.classList.add('active');
          return; // Don't show anything else while loading
        }
        loadingView.style.display = 'none';
        loadingView.classList.remove('active');
      }

      [navDashboard, navUsers, navRequest].forEach((n) => n?.classList.remove('active'));
      [dashboardView, usersView, requestEntryView].forEach((v) => {
        if (v) {
          v.classList.remove('active');
          v.style.display = 'none';
        }
      });

      if (activeView === 'users' && usersView) {
        usersView.style.display = 'block';
        usersView.classList.add('active');
        navUsers?.classList.add('active');
      } else if (activeView === 'new-request-entry' && requestEntryView) {
        requestEntryView.style.display = 'block';
        requestEntryView.classList.add('active');
        navRequest?.classList.add('active');
        if (subtitle) subtitle.textContent = 'Staff submission portal';
      } else if (dashboardView) {
        dashboardView.style.display = 'block';
        dashboardView.classList.add('active');
        navDashboard?.classList.add('active');
      }
      if (subtitle) subtitle.textContent = 'District data management portal';
    });

    // 5. Global click listener to handle "outside clicks" for closing panels
    window.addEventListener('click', (e) => {
      const panel = document.querySelector('details-panel') as any;
      // If the panel is in edit mode, we don't want to close it accidentally
      if (panel && panel.mode === 'edit') return;

      const path = e.composedPath();
      const isPanel = path.some((el: any) => el.tagName === 'DETAILS-PANEL');
      const isRow = path.some((el: any) => el.tagName === 'APP-ROW');

      // If clicking outside both the panel and the table rows, clear selection
      if (!isPanel && !isRow) {
        store.setState({ selectedRow: null });
      }
    });
  }
}

// Instantiate the app when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  (window as any).app = new App();
});
