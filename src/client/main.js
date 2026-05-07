/// <reference types="google-apps-script" />

import contactorSelectTemplate from './components/contractorSelect.htm?raw';
import schoolSelectTemplate from './components/schoolSelect.htm?raw';
import statusSelectTemplate from './components/statusSelect.htm?raw';
import detailsTranslationTemplate from './components/detailsTranslation.htm?raw';
import detailsInterpretationTemplate from './components/detailsInterpretation.htm?raw';
import emptyRowTemplate from './components/emptyTableRow.htm?raw';
import emptyDetailsTemplate from './components/emptyDetails.htm?raw';
import tableRowTemplate from './components/tableRow.htm?raw';

const tableBody = document.getElementById('requests-table-body');
const schoolFilterWrapper = document.getElementById('school-filter-wrapper');
const resultsCount = document.getElementById('results-count');
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
  renderList(null, schoolFilterWrapper, schoolSelectBlueprint, (row) => {
    // All the specific filling logic stays here
    row.id = 'school-filter';
    row.addEventListener('change', () => {
      activeRowId = null;
      renderRequestsTable(requests);
    });
  });
}

function renderRequestsTable(requests) {
  const filteredRequests = getFilteredRequests(requests);
  resultsCount.textContent = `${filteredRequests.length} entr${filteredRequests.length === 1 ? 'y' : 'ies'}`;

  renderTableRows(filteredRequests);
  renderDetails(activeRowId);
}

function getFilteredRequests(requests) {
  const schoolFilter = schoolFilterWrapper.querySelector('.school-filter');
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

  renderList(requests, tableBody, tableRowBlueprint, (row, request) => {
    populateRowData(row, request);
  });
}

function populateRowData(row, request) {
  row.dataset.id = request.id;
  row.querySelector('.requester-name').textContent = request.name;
  row.querySelector('.requester-school').textContent = request.school;
  row.querySelector('.status').textContent = request.status;
  row.querySelector('.request-date').textContent = formatDate(request.requestDate, 'MMM D, YYYY');
  row.querySelector('.submitted-date').textContent = formatDate(request.submittedDate, 'MMM D, YYYY');
  row.querySelector('.reqType').textContent = request.reqType;
  const badge = row.querySelector('.badge');
  badge.className = `badge ${getBadgeClass(request.status)}`;

  row.addEventListener('click', () => {
    handleRowClicks(row);
  });
}

function handleRowClicks(row) {
  activeRowId = row.dataset.id;
  console.log('Row clicked, activeRowId set to:', activeRowId);
  updateActiveRow();
  renderDetails(activeRowId);
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
    return;
  }

  const blueprint = request.reqType === 'Interpretation' ? detailsInterpretationBlueprint : detailsTranslationBlueprint;

  renderList(request, detailsCard, blueprint, (row, request) => {
    populateDetailsData(row, request, blueprint === detailsInterpretationBlueprint ? 'Interpretation' : 'Translation');
  });
}

function populateDetailsData(element, request, type) {
  populateCommonDetails(element, request);
  const specificMapper = detailMappers[type];
  if (specificMapper) {
    specificMapper(element, request);
  } else {
    console.warn(`No detail mapper found for type "${type}"`);
  }
}

const detailMappers = {
  Translation: (element, request) => {
    element.querySelector('.document-link a').href = request.documentLink || '#';
    element.querySelector('.document-sent-date input').value = formatDate(request.documentSentDate, 'MMM D, YYYY');
    element.querySelector('.document-received-date input').value = formatDate(
      request.documentReceivedDate,
      'MMM D, YYYY'
    );
  },
  Interpretation: (element, request) => {
    element.querySelector('.request-date').textContent = formatDate(request.requestDate, 'MMM D, YYYY');
    element.querySelector('.start-end-time').textContent =
      formatTime(request.startTime, 'h:mm A') + ' - ' + formatTime(request.endTime, 'h:mm A');
    element.querySelector('.contractor-contracted-date input').value = formatDate(
      request.contractorContractedDate,
      'MMM D, YYYY'
    );
    element.querySelector('.guest-attendance-date input').value = formatDate(
      request.guestConfirmationDate,
      'MMM D, YYYY'
    );
    element.querySelector('.technology-confirmed-date input').value = formatDate(
      request.technologyConfirmationDate,
      'MMM D, YYYY'
    );
  },
};

function populateCommonDetails(element, request) {
  element.querySelector('.request-id .content').textContent = request.id;
  element.querySelector('.languages .content').textContent = request.originalLanguage + ' to ' + request.targetLanguage;
  element.querySelector('.description .content').textContent = request.description;
  element.querySelector('.contractor .content').innerHTML = contractorSelectBlueprint;
  element.querySelector('.contractor-name input').value = request.contractorName || '';

  const status = element.querySelector('.status .content');
  renderList(request, status, statusSelectBlueprint, (element, request) => {
    const badge = element.querySelector('.badge');
    badge.textContent = request.status;
    badge.className = `badge ${getBadgeClass(request.status)}`;
    const select = element.querySelector('select');
    select.value = request.status;
    select.addEventListener('change', (e) => {
      handleStatusChange(e, request.id, request.status, element);
    });
  });

  const contractor = element.querySelector('.contractor .content');
  renderList(request, contractor, contractorSelectBlueprint, (element, request) => {
    element.value = request.contractor || '';
    element.addEventListener('change', () => {
      handleContractorChange();
    });
  });
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
  saveRequestProperty(activeRowId, 'contractor', selectValue);
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
  saveStatusChange(activeRowId, statusText);
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

  google.script.run.withSuccessHandler(updatedRequest).updateRequestProperty(requestId, propName, propValue);
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

const schoolSelectBlueprint = createBlueprint(schoolSelectTemplate, '.school-filter');
const emptyDetailsBlueprint = createBlueprint(emptyDetailsTemplate, '.empty-state');
const emptyRowBlueprint = createBlueprint(emptyRowTemplate, '.empty-state');
const tableRowBlueprint = createBlueprint(tableRowTemplate, '.request-row');
const detailsTranslationBlueprint = createBlueprint(detailsTranslationTemplate, '.details-translation');
const detailsInterpretationBlueprint = createBlueprint(detailsInterpretationTemplate, '.details-interpretation');
const contractorSelectBlueprint = createBlueprint(contactorSelectTemplate, '#translation-select');
const statusSelectBlueprint = createBlueprint(statusSelectTemplate, '.status-container');
