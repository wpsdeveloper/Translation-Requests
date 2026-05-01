/// <reference types="google-apps-script" />

/** @type {google.script.run} */
// const gsr = google.script.run;

// 

const tableBody = document.getElementById('requestsTableBody');
const schoolFilter = document.getElementById('schoolFilter');
const resultsCount = document.getElementById('resultsCount');
const emptyState = document.getElementById('emptyState');
const requestDetails = document.getElementById('requestDetails');
let activeRowId = null;/** @type {string|null} */ (null);
let allRequests = []; /** @type {Array} */ ([]);

function getSchoolOptions() {
  if (!Array.isArray(allRequests) || !allRequests.length) {
    return ['all'];
  }
  const schools = Array.from(new Set(allRequests.map((request) => request.school))).sort();
  return ['all', ...schools];
}

function renderFilterOptions() {
  const options = getSchoolOptions();
  schoolFilter.innerHTML = options
    .map((school) => {
      const label = school === 'all' ? 'All schools' : school;
      return `<option value="${school}">${label}</option>`;
    })
    .join('');
}

function getFilteredRequests() {
  const selectedSchool = schoolFilter.value;
  if (selectedSchool === 'all') {
    return allRequests;
  }
  return allRequests.filter((request) => request.school === selectedSchool);
}

function renderTable() {
  const filteredRequests = getFilteredRequests();
  resultsCount.textContent = `${filteredRequests.length} entr${filteredRequests.length === 1 ? 'y' : 'ies'}`;

  if (!filteredRequests.length) {
    tableBody.innerHTML = '';
    emptyState.hidden = false;
    requestDetails.innerHTML = '<div class="empty-state">Select a request row to view details here.</div>';
    return;
  }

  emptyState.hidden = true;
  tableBody.innerHTML = filteredRequests
    .map(
      (request) => `
      <tr data-id="${request.id}" class="${request.id === activeRowId ? 'active' : ''}">
        <td>${request.status}</td>
        <td>${request.requestDate.toLocaleDateString()}</td>
        <td>${request.submittedDate.toLocaleDateString()}</td>
        <td>${request.name}</td>
        <td>${request.reqType}</td>
      </tr>`
    )
    .join('');

  attachRowHandlers();

  if (!activeRowId || !filteredRequests.some((item) => item.id === activeRowId)) {
    activeRowId = filteredRequests[0].id;
  }
  renderDetails(activeRowId);
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
    requestDetails.innerHTML = '<div class="empty-state">No request selected.</div>';
    return;
  }

  if (request.reqType === 'Interpretation') {
    requestDetails.innerHTML = `
      <div class="detail-item">
        <label>Request ID ${request.id}</label>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <div><span class="badge">${request.status}</span></div>
      </div>
      <div class="detail-item">
        <label>Event Details</label>
        <div class="detail-value">${request.requestDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}, 
        ${request.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
        -${request.endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true })}
        </div>
        <div class="detail-value">${request.eventLocation}</div>
      </div>
      <div class="detail-item">
        <label>Details</label>
        <div class="detail-value">${request.description}</div>
      </div>`;
  } else if (request.reqType === 'Translation') {
    requestDetails.innerHTML = `
      <div class="detail-item">
        <label>Request ID ${request.id}</label>
      </div>
      <div class="detail-item">
        <label>Status</label>
        <div><span class="badge">${request.status}</span></div>
      </div>
      <div class="detail-item">
        <label>Document Link</label>
        <div>
          <a href="${request.docLink}" target="_blank">Document original</a>
        </div>
      </div>
      <div class="detail-item">
        <label>Page Count</label>
        <div class="detail-value">${request.docPageCount}</div>
      </div>
      <div class="detail-item">
        <label>Details</label>
        <div class="detail-value">${request.description}</div>
      </div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
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
  console.log("Raw data from server:", serializedData);
  const dataRaw = JSON.parse(serializedData);
  allRequests = parseData(dataRaw);
  renderRequests();
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

function renderRequests() {
  renderFilterOptions();
  renderTable();
  schoolFilter.addEventListener('change', () => {
    activeRowId = null;
    renderTable();
  });
}