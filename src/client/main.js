/// <reference types="google-apps-script" />

import contactorSelectTemplate from './components/contractorSelect.htm?raw';
import schoolSelectTemplate from './components/schoolSelect.htm?raw';
import detailsTranslationTemplate from './components/detailsTranslation.htm?raw';
import detailsInterpretationTemplate from './components/detailsInterpretation.htm?raw';
import emptyRowTemplate from './components/emptyTableRow.htm?raw';
import emptyDetailsTemplate from './components/emptyDetails.htm?raw';
import tableRowTemplate from './components/tableRow.htm?raw';

/** @type {google.script.run} */
// const gsr = google.script.run;

const tableBody = document.getElementById('requests-table-body');
const schoolFilter = document.getElementById('school-filter');
const resultsCount = document.getElementById('results-count');
const emptyState = document.querySelectorAll('.empty-state');
const detailsCard = document.getElementById('details-card-body');
const requestDetails = document.getElementById('details-column-1');
let activeRowId = null;
let allRequests = [];
let isDebug = window.location.href.includes('localhost');

document.addEventListener('DOMContentLoaded', () => {
  if (isDebug) {
    import('./mock-data.js').then((module) => {
      console.log('Mock data loaded dynamically');
      receiveDataFromServer(module.getMockData());
    });
    return;
  }

  google.script.run
    .withSuccessHandler(receiveDataFromServer)
    .withFailureHandler((error) => {
      // This will give you the ACTUAL server-side error message
      console.error('Server Error:', error.message);
      console.error('Stack Trace:', error.stack);
    })
    .getDataFromServer();
});

function receiveDataFromServer(serializedData) {
  const dataRaw = JSON.parse(serializedData);
  allRequests = parseData(dataRaw);
  console.log(allRequests);
  initializeUI(allRequests);
  renderRequestsTable(allRequests);
}

function parseData(data) {
  const parsedData = [];
  data.forEach((item) => {
    item.id = item.id ? item.id.toString() : '';
    item.requestDate = item.requestDate ? new Date(item.requestDate) : '';
    item.submittedDate = item.submittedDate ? new Date(item.submittedDate) : '';
    item.startTime = item.startTime ? new Date(item.startTime) : '';
    item.endTime = item.endTime ? new Date(item.endTime) : '';
    console.log('Parsed item:', item);
    parsedData.push(item);
  });
  return parsedData;
}

function initializeUI(requests) {
  schoolFilter.innerHTML = schoolSelectTemplate;
  schoolFilter.addEventListener('change', () => {
    activeRowId = null;
    renderRequestsTable(requests);
  });
}

function renderRequestsTable(requests) {
  const filteredRequests = getFilteredRequests(requests);
  resultsCount.textContent = `${filteredRequests.length} entr${filteredRequests.length === 1 ? 'y' : 'ies'}`;
  
  renderTableRows(filteredRequests);
  attachRowHandlers();
  
  renderDetails(activeRowId);
}

function getFilteredRequests(requests) {
  const selectedSchool = schoolFilter.value;
  if (selectedSchool === 'all') {
    return requests;
  }
  return requests.filter((request) => request.school === selectedSchool);
}

function renderTableRows(requests) {
  tableBody.innerHTML = '';

  if (!requests || requests.length === 0) {
    // We clone it so we can potentially reuse it or change its text
    const emptyRow = emptyRowBlueprint.cloneNode(true);
    tableBody.appendChild(emptyRow);
    return;
  }

  renderList(
    requests, 
    tableBody, 
    tableRowBlueprint, 
    (row, request) => {
      // All the specific filling logic stays here
      row.querySelector('.name').textContent = request.name;
      row.querySelector('.status').textContent = request.status;
      row.querySelector('.request-date').textContent = formatDate(request.requestDate, 'MMM D, YYYY');
      row.querySelector('.submitted-date').textContent = formatDate(request.submittedDate, 'MMM D, YYYY');
      row.querySelector('.reqType').textContent = request.reqType;
      const badge = row.querySelector('.badge');
      badge.className = `badge ${getBadgeClass(request.status)}`;
      row.dataset.id = request.id;
    }
  );
}

function attachRowHandlers() {
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      activeRowId = row.dataset.id;
      console.log('Row clicked, activeRowId set to:', activeRowId);
      updateActiveRow();
      renderDetails(activeRowId);
    });
  });
}

function updateActiveRow() {
  tableBody.querySelectorAll('tr').forEach((row) => {
    row.classList.toggle('active', row.dataset.id === activeRowId);
  });
}

function renderDetails(requestId) {
  const request = allRequests.find((item) => item.id === requestId);
  if (!request) {
    requestDetails.innerHTML = emptyDetailsTemplate;
    emptyState.hidden = false;
    return;
  }

  if (request.reqType === 'Interpretation') {
    detailsCard.innerHTML = getDetailsHTMLInterpretation(request);
  } else if (request.reqType === 'Translation') {
    detailsCard.innerHTML = getDetailsHTMLTranslation(request);
  }
  emptyState.hidden = true;
  document.getElementById('status-select').value = request.status;
  attachDetailsHandlers(requestId);
}

function getDetailsHTMLInterpretation(request) {
  return detailsInterpretationTemplate; 
}

function getDetailsHTMLTranslation(request) {
  return detailsTranslationTemplate;
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

function attachDetailsHandlers() {
  attachTranslationSelectHandler();
  attachStatusSelectHandler();
}

function attachTranslationSelectHandler() {
  const translationSelect = document.getElementById('translation-select');
  const contractorNameDiv = document.querySelector('.contractor-name');
  translationSelect.addEventListener('change', () => {
    console.log('Translation service selected:', translationSelect.value);
    const selectValue = translationSelect.value;
    switch (selectValue) {
      case 'Lexikeet':
      case 'MAPA':
      case 'Google Translate':
        contractorNameDiv.style.display = 'none';
        break;
      case 'Staff member':
      case 'Contractor':
      default:
        contractorNameDiv.style.display = 'block';
    }
  });
}
function attachStatusSelectHandler() {
  const statusBadge = document.getElementById('status-badge');
  const statusSelect = document.getElementById('status-select');

  statusSelect.addEventListener('change', (e) => {
    const statusText = e.target.options[e.target.selectedIndex].text;

    // 1. Update the text
    statusBadge.textContent = statusText;

    // 2. Optional: Update colors based on status
    statusBadge.className = 'badge'; // Reset to base class
    statusBadge.classList.add(getBadgeClass(statusText)); // Add new class based on status

    updateStatusBadges(statusText, activeRowId);
    saveStatusChange(activeRowId, statusText);
  });
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

function saveStatusChange(requestId, newStatus) {
  saveRequestProperty(requestId, 'status', newStatus);
} 

function saveRequestProperty(requestId, propName, propValue) {
  if (isDebug) {
    const request = allRequests.find((req) => req.id === requestId);
    if (request) {
      request[propName] = propValue;
      updatedRequest(request);
    }
    return;
  }

  google.script.run
    .withSuccessHandler(updatedRequest)
    .updateRequestProperty(requestId, propName, propValue);
} 

function updatedRequest(request) {
  console.log('Updated request received from server:', request);
  const index = allRequests.findIndex((req) => req.id === request.id);
  if (index !== -1) {
    allRequests[index] = request;
    renderRequestsTable(allRequests);
    renderDetails(request.id);
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
  if (!data?.length) return;

  const fragment = document.createDocumentFragment();
  
  data.forEach(item => {
    const clone = blueprint.cloneNode(true);
    // Let the specific component decide how to fill the data
    populateFn(clone, item); 
    fragment.appendChild(clone);
  });

  container.appendChild(fragment);
};

const tableRowBlueprint = createBlueprint(tableRowTemplate, '.request-row');
const emptyRowBlueprint = createBlueprint(emptyRowTemplate, '.empty-state');  
const detailsTranslationBlueprint = createBlueprint(detailsTranslationTemplate, '.details-translation');
const detailsInterpretationBlueprint = createBlueprint(detailsInterpretationTemplate, '.details-interpretation');
const contractorSelectBlueprint = createBlueprint(contactorSelectTemplate, '#translation-select');
const schoolSelectBlueprint = createBlueprint(schoolSelectTemplate, '#school-filter');
const emptyDetailsBlueprint = createBlueprint(emptyDetailsTemplate, '.empty-state');

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
