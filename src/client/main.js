/// <reference types="google-apps-script" />

import * as htmlTemplates from './html-templates.js';

/** @type {google.script.run} */
// const gsr = google.script.run;

const tableBody = document.getElementById('requests-table-body');
const schoolFilter = document.getElementById('school-filter');
const resultsCount = document.getElementById('results-count');
const emptyState = document.querySelectorAll('.empty-state');
const requestDetails = document.getElementById('request-details');
const processingDetails = document.getElementById('request-processing');
let activeRowId = null;
let allRequests = [];

document.addEventListener('DOMContentLoaded', () => {
  const url = window.location.href;
  if (url.includes('localhost')) {
    import('./mock-data.js').then((module) => {
      console.log("Mock data loaded dynamically");
      receiveDataFromServer(module.getMockData());
    });
    return;
  }
  
  google.script.run
    .withSuccessHandler(receiveDataFromServer)
    .withFailureHandler((error) => {
      // This will give you the ACTUAL server-side error message
      console.error("Server Error:", error.message);
      console.error("Stack Trace:", error.stack);
    })
    .getDataFromServer();
});

function receiveDataFromServer(serializedData) {
  const dataRaw = JSON.parse(serializedData);
  allRequests = parseData(dataRaw);
  console.log(allRequests);
  renderRequests(allRequests);
}

function parseData(data) {
  data.forEach(item => {
    item.requestDate = item.requestDate ? new Date(item.requestDate) : '';
    item.submittedDate = item.submittedDate ? new Date(item.submittedDate) : '';
    item.startTime = item.startTime ? new Date(item.startTime) : '';
    item.endTime = item.endTime ? new Date(item.endTime) : '';
  });
  return data;
}

function renderRequests(requests) {
  renderFilterOptions(requests);
  renderTable(requests);
  schoolFilter.addEventListener('change', () => {
    activeRowId = null;
    renderTable(requests);
  });
}


export function getSchoolOptions(requests) {
  if (!Array.isArray(requests) || !requests.length) {
    return ['all'];
  }
  const schools = Array.from(new Set(requests.map((request) => request.school))).sort();
  return ['all', ...schools];
}

export function renderFilterOptions(requests) {
  const options = getSchoolOptions(requests);
  schoolFilter.innerHTML = options
    .map((school) => {
      const label = school === 'all' ? 'All schools' : school;
      return `<option value="${school}">${label}</option>`;
    })
    .join('');
}

function getFilteredRequests(requests) {
  const selectedSchool = schoolFilter.value;
  if (selectedSchool === 'all') {
    return requests;
  }
  return requests.filter((request) => request.school === selectedSchool);
}

function renderTable(requests) {
  const filteredRequests = getFilteredRequests(requests);
  resultsCount.textContent = `${filteredRequests.length} entr${filteredRequests.length === 1 ? 'y' : 'ies'}`;
  
  if (!filteredRequests.length) {
    emptyState.hidden = false;
    requestDetails.innerHTML = htmlTemplates.emptyRowTemplate();
    return;
  }
  
  emptyState.hidden = true;
  tableBody.innerHTML = renderTableRows(filteredRequests);
  
  attachRowHandlers();

  // if (!activeRowId || !filteredRequests.some((item) => item.id === activeRowId)) {
  //   activeRowId = filteredRequests[0].id;
  // }
  renderDetails(activeRowId);
}

export function renderTableRows(requests) {
  if (!requests || (requests.length === 0)) {
    return "";
  }
  return requests
    .map(
      (request) => htmlTemplates.tableRowTemplate(request,{
        badgeClass: getBadgeClass(request.status),
        requestDate: formatDate(request.requestDate, "M/D/YYYY"),
        submittedDate: formatDate(request.submittedDate, "M/D/YYYY"),
        isActive: request.id === activeRowId
      })
    )
    .join('');
}

function attachRowHandlers() {
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach((row) => {
    row.addEventListener('click', () => {
      activeRowId = row.dataset.id;
      console.log("Row clicked, activeRowId set to:", activeRowId);
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
    requestDetails.innerHTML = htmlTemplates.emptyDetailsTemplate();
    return;
  }
  if (request.reqType === 'Interpretation') {
    requestDetails.innerHTML = getDetailsHTMLInterpretation(request);
    processingDetails.innerHTML = getProcessingHTMLInterpretation(request);
  } else if (request.reqType === 'Translation') {
    requestDetails.innerHTML = getDetailsHTMLTranslation(request);
    processingDetails.innerHTML = getProcessingHTMLTranslation(request);
  }
}

function getDetailsHTMLInterpretation(request) {
  return htmlTemplates.detailsInterpretationTemplate(request, {
    requestDate: formatDate(request.requestDate, "MMM D, YYYY"),
    startTime: formatTime(request.startTime, "h:mm A"),
    endTime: formatTime(request.endTime, "h:mm A")
  });
}

function getDetailsHTMLTranslation(request) {
  return htmlTemplates.detailsTranslationTemplate(request, {
    requestDate: formatDate(request.requestDate, "MMM D, YYYY"),
  });
}

function getProcessingHTMLInterpretation(request) {  
  return htmlTemplates.processingInterpretationTemplate(request, {
    badgeClass: getBadgeClass(request.status),
  });
}

function getProcessingHTMLTranslation(request) {
  return htmlTemplates.processingTranslationTemplate(request, {
    badgeClass: getBadgeClass(request.status),
  });
}

  function getBadgeClass(status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'badge-pending';
      case 'in progress':
        return 'badge-in-progress';
      case 'completed':
        return 'badge-completed';
      default:
        return 'badge';
    }
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
    console.error('Error formatting date:', error);
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

