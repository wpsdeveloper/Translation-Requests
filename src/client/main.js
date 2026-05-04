/// <reference types="google-apps-script" />

/** @type {google.script.run} */
// const gsr = google.script.run;

// 

const tableBody = document.getElementById('requests-table-body');
const schoolFilter = document.getElementById('school-filter');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('empty-state');
const requestDetails = document.getElementById('request-details');
const processingDetails = document.getElementById('request-processing');
let activeRowId = null;/** @type {string|null} */ (null);
let allRequests = []; /** @type {Array} */ ([]);

document.addEventListener('DOMContentLoaded', () => {
  const url = window.location.href;
  if (url.includes('localhost')) {
    console.log("Running in development mode, using mock data.");
    allRequests = parseData(JSON.parse(getMockData()));
    renderRequests(allRequests);
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
        <td><span class="badge ${getBadgeClass(request.status)}">${request.status}</span></td>
        <td>${request.requestDate.toLocaleDateString()}</td>
        <td>${request.submittedDate.toLocaleDateString()}</td>
        <td>${request.reqType}</td>
        <td>${request.name}</td>
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
    requestDetails.innerHTML = getDetailsHTMLInterpretation(request);
    processingDetails.innerHTML = getProcessingHTMLInterpretation(request);
  } else if (request.reqType === 'Translation') {
    requestDetails.innerHTML = getDetailsHTMLTranslation(request);
    processingDetails.innerHTML = getProcessingHTMLTranslation(request);
  }
}

function getDetailsHTMLInterpretation(request) {
  return `
    <div class="detail-item">
      <label>Request ID ${request.id}</label>
    </div>
    <div class="detail-item">
      <label>Languages</label>
      <div class="detail-value">${request.originalLanguage} to ${request.targetLanguage}</div>
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
  }
  function getDetailsHTMLTranslation(request) {
    return `
    <div class="detail-item">
      <label>Request ID ${request.id}</label>
    </div>
    <div class="detail-item">
      <label>Languages</label>
      <div class="detail-value">${request.originalLanguage} to ${request.targetLanguage}</div>
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
  
  function getProcessingHTMLInterpretation(request) {
    return `
    <div class="detail-item">
      <label>Status</label>
    <div><span class="badge ${getBadgeClass(request.status)}">${request.status}</span></div>
    </div>
    <div class="detail-item">
      <label>Interpreter selected</label>
      <select id="interpreter-select">
        <option value="">Select an interpreter</option>
        <option value="Lexikeet">Lexikeet</option>
        <option value="MAPA">MAPA</option>
        <option value="Google Translate">Google Translate</option>
        
        <option value="Staff member">Staff member</option>
        <option value="Contractor">Contractor</option>
      </select>
      <div class="interpreter-name" style="display:none;margin-top:8px;">
        <label>Name</label>
         <div class="detail-value"></div>
      </div>
    </div>
    <div class="detail-item">
      <label>Interpreter contracted</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Guest attendance confirmed</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Technology confirmed</label>
      <div class="detail-value"></div>
    </div>
    `;
  }
  
  function getProcessingHTMLTranslation(request) {
    return`
    <div class="detail-item">
      <label>Status</label>
    <div><span class="badge ${getBadgeClass(request.status)}">${request.status}</span></div>
    </div>
    <div class="detail-item">
      <label>Translation service</label>
      <select id="translation-select">
        <option value="">Select a translation service</option>
        <option value="Lexikeet">Lexikeet</option>
        <option value="MAPA">MAPA</option>
        <option value="Google Translate">Google Translate</option>
        <option value="Staff member">Staff member</option>
        <option value="Contractor">Contractor</option>
      </select>
      <div class="interpreter-name" style="display:none;margin-top:8px;">
        <label>Name</label>
        <div class="detail-value"></div>
      </div>
    </div>
    <div class="detail-item">
      <label>Document sent (date)</label>
      <div class="detail-value"></div>
    </div>
    <div class="detail-item">
      <label>Document received (date)</label>
      <div class="detail-value"></div>
    </div>
    `;
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

function getMockData() {
  return JSON.stringify(mockData.requests);
};

const mockData = {
  requests: [{
    id: '12345',
    status: 'Pending',
    requestDate: new Date(),
    submittedDate: new Date(),  
    name: 'John Doe',
    reqType: 'Translation',
    eventLocation: '123 Main St, Anytown, USA',
    description: 'Requesting translation of syllabus.',
    docLink: 'https://example.com/document',
    docPageCount: 10,
    school: 'Washington High School',
    originalLanguage: 'English',
    targetLanguage: 'Spanish',
  },
  {
    id: '67890',
    status: 'Completed',
    requestDate: new Date(),
    submittedDate: new Date(),
    name: 'Jane Smith',
    reqType: 'Interpretation',
    eventLocation: '456 Oak Ave, Somewhere, USA',
    description: 'Requesting interpretation services for an upcoming event.',
    startTime: new Date('5/25/2026 6:00 PM'),
    endTime: new Date('5/25/2026 7:00 PM'),
    school: 'Lincoln High School',
    originalLanguage: 'English',
    targetLanguage: 'Chinese',
  }]
};