import { store } from './services/state';
import { fetchData } from './services/api';
// We don't need .js extension in imports for Vite when using TS
import './components/AppTable/AppTable';
import './components/DetailsPanel/DetailsPanel';
import './components/StatusMultiSelect/StatusMultiSelect';
import './components/UserManagement/UserManagement';
import './components/UserEditor/UserEditor';

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

      // 3. Update the store
      // This triggers components to update automatically
      store.setState({
        allRows: requests,
        schools: schools,
        user: user,
        loading: false,
      });
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

    // 3. User Management Navigation
    const navUsers = document.getElementById('nav-users');
    const navDashboard = document.getElementById('nav-dashboard');
    const mainNav = document.getElementById('main-nav');

    if (navUsers && navDashboard) {
      navUsers.addEventListener('click', () => {
        store.setState({ activeView: 'users' });
      });
      navDashboard.addEventListener('click', () => {
        store.setState({ activeView: 'dashboard' });
      });
    }

    // 4. Global Store Subscription for View Toggling
    store.subscribe((state) => {
      const { activeView, user } = state;

      // Toggle Navigation Visibility
      if (mainNav) {
        mainNav.style.display = user && user.role === 'Admin' ? 'flex' : 'none';
      }

      // Toggle Views
      const dashboardView = document.getElementById('dashboard-view');
      const usersView = document.getElementById('users-view');

      if (dashboardView && usersView && navUsers && navDashboard) {
        if (activeView === 'users') {
          dashboardView.classList.remove('active');
          usersView.classList.add('active');
          navUsers.classList.add('active');
          navDashboard.classList.remove('active');
        } else {
          dashboardView.classList.add('active');
          usersView.classList.remove('active');
          navDashboard.classList.add('active');
          navUsers.classList.remove('active');
        }
      }
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
