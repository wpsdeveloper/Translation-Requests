/// <reference types="google-apps-script" />

import contactorSelectTemplate from './components/contractorSelect.htm?raw';
import schoolSelectTemplate from './components/schoolSelect.htm?raw';
import statusSelectTemplate from './components/statusSelect.htm?raw';
import detailsTranslationTemplate from './components/detailsTranslation.htm?raw';
import detailsInterpretationTemplate from './components/detailsInterpretation.htm?raw';

import { store } from './services/state.js';
import { fetchData } from './services/api.js';
import './components/AppTable/AppTable.js'; // Ensure the main table component is registered

const tableBody = document.getElementById('requests-table-body');
const schoolFilterWrapper = document.getElementById('school-filter-wrapper');
const resultsCount = document.getElementById('results-count');
const detailsCard = document.getElementById('details-card-body');
const requestDetails = document.getElementById('details-column-1');
let activeRowId = null;
let allRequests = [];
let isDebug = window.location.href.includes('localhost');

document.addEventListener('DOMContentLoaded', () => {
  init();
});

async function init() {
  // 1. Set initial loading state
  store.setState({ loading: true, allRows: [] });

  try {
    // 2. Fetch the data (either mock or GAS)
    const data = await fetchData();

    // 3. Update the store
    // This triggers the Table component to render the rows automatically
    store.setState({ allRows: data, loading: false });
    console.log(store.getState());
  } catch (err) {
    console.error("Failed to load data:", err);
    store.setState({ loading: false, error: err.message });
  }
}





function populateCommonDetails(element, request) {
  element.querySelector('.request-id .content').textContent = request.id;
  element.querySelector('.languages .content').textContent = request.originalLanguage + ' to ' + request.targetLanguage;
  element.querySelector('.description .content').textContent = request.description;
  element.querySelector('.contractor-name input').value = request.contractorName || '';


 
  handleContractorChange(); // Set initial visibility based on current value
}

function handleContractorChange() {
  const selectValue = document.querySelector('#details-card .contractor select').value;
  switch (selectValue) {
    case 'Lexikeet':
    case 'MAPA':
    case 'Google Translate':
      document.querySelector('#details-card .contractor-name').style.display = 'none';
      break;
    case 'Staff member':
    case 'Contractor':
    default:
      document.querySelector('#details-card .contractor-name').style.display = '';
  }
  console.log(document.querySelector('#details-card .contractor-name'));
}

function handleStatusChange(e, requestId, newStatus, statusElement) {
  const statusText = e.target.options[e.target.selectedIndex].text;
  const statusBadge = statusElement.querySelector('.badge');

  // 1. Update the text
  statusBadge.textContent = statusText;

  // 2. Optional: Update colors based on status
  statusBadge.className = 'badge'; // Reset to base class
  statusBadge.classList.add(getBadgeClass(statusText)); // Add new class based on status

  updateStatusBadges(statusText, activeRowId);
}

function updateStatusBadges(status, requestId) {
  const statusBadgeDetails = document.getElementById('status-badge');
  const rowBadge = document.querySelector(`[data-id="${requestId}"] .badge`);

  statusBadgeDetails.textContent = status;
  rowBadge.textContent = status;

  // Remove existing status classes
  statusBadgeDetails.className = 'badge';
  rowBadge.className = 'badge';

  const badgeClass = getBadgeClass(status);

  statusBadgeDetails.classList.add(badgeClass);
  rowBadge.classList.add(badgeClass);
}




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
