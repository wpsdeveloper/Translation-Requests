/// <reference types="google-apps-script" />

import { store } from './services/state.js';
import { fetchData } from './services/api.js';
import './components/AppTable/AppTable.js';
import './components/DetailsPanel/DetailsPanel';

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // 1. Set initial loading state
  store.setState({ loading: true, allRows: [] });

  try {
    // 2. Fetch the data (either mock or GAS)
    const { requests, schools } = await fetchData();
    console.log(requests);

    // 3. Update the store
    // This triggers components to update automatically
    store.setState({
      allRows: requests,
      schools: schools,
      loading: false,
    });
    console.log(store.getState());

    // 4. Setup filter listener
    const schoolFilter = document.getElementById('school-filter');
    if (schoolFilter) {
      schoolFilter.addEventListener('change', (e) => {
        store.setState({ filterSchool: e.detail.value });
      });
    }
  } catch (err) {
    console.error("Failed to load data:", err);
    store.setState({ loading: false, error: err.message });
  }
}

window.addEventListener('click', (e) => {
  const panel = document.querySelector('details-panel');
  if (panel && panel.mode === 'edit') return;

  const path = e.composedPath();
  const isPanel = path.some((el) => el.tagName === 'DETAILS-PANEL');
  const isRow = path.some((el) => el.tagName === 'APP-ROW');

  if (!isPanel && !isRow) {
    store.setState({ selectedRow: null });
  }
});







export function getBadgeClass(status) {
  if (!status || typeof status !== 'string') {
    return 'badge';
  }

  switch (status.toLowerCase()) {
    case 'needs approval':
      return 'badge-needs-approval';
    case 'approved':
      return 'badge-approved';
    case 'scheduled':
      return 'badge-scheduled';
    case 'sent for translation':
      return 'badge-sent-for-translation';
    case 'denied':
      return 'badge-denied';
    case 'completed':
      return 'badge-completed';
    default:
      return 'badge';
  }
}


/**
 * Utility to turn an HTML string into a reusable DOM element
 */
const createBlueprint = (htmlString, selector) => {
  const temp = document.createElement('template');
  temp.innerHTML = htmlString.trim();
  const element = temp.content.querySelector(selector);

  if (!element) {
    throw new Error(`Could not find selector "${selector}" in template`);
  }

  return element;
};

/**
 * Generic renderer that handles the fragment logic
 */
function renderList(data, container, blueprint, populateFn) {
  container.innerHTML = '';
  if (!Array.isArray(data) || !data?.length) {
    data = [data]; // We need at least one item to render the empty state
  }

  const fragment = document.createDocumentFragment();

  data.forEach((item) => {
    const clone = blueprint.cloneNode(true);
    // Let the specific component decide how to fill the data
    populateFn(clone, item);
    fragment.appendChild(clone);
  });

  container.appendChild(fragment);
}

export function formatDate(date, format) {
  try {
    switch (format) {
      case 'MM/DD/YYYY':
        return date.toLocaleDateString('en-US');
      case 'MMM D, YYYY':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    // console.warn('Error formatting date:', error);
    return '';
  }
}

export function formatTime(time, format) {
  if (!time || !(time instanceof Date) || isNaN(time)) {
    return '';
  }

  switch (format) {
    case 'h:mm A':
      return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    default:
      return time.toLocaleTimeString();
  }
}
