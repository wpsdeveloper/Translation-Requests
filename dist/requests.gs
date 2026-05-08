function getRequests(filter = 'all') {
  const allRequests = loadRequestsFromSpreadsheet();
  if (filter === 'all') {
    return allRequests;
  }
  return allRequests.filter((request) => request.school === filter);  
}

function loadRequestsFromSpreadsheet() {  
  const spreadsheet = SpreadsheetApp.openById(FORM_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('Form Responses 1');
  const sheetRows = sheet.getDataRange().getValues();
  
  // Assuming the first row is headers
  const headers = sheetRows[0];
  const requests = parseRequestsFromSheet(sheetRows);
  
  return requests;
}

function parseRequestsFromSheet(sheetRows) {
  const requests = [];
  for (let i = 1; i < sheetRows.length; i++) {
    const request = parseRequestRow(sheetRows[i]);
    if (request) {
      requests.push(request);
    }
  }
  
  return requests;
} 

function parseRequestRow(row) {
  if ((typeof row[2] === "number") || (row[2].indexOf('@') === -1)) {
    return null; // Skip rows where the email column doesn't contain an '@' symbol
  }
  console.log('Parsing row:', row);
  const request = {
    id: makeString(row[0]),
    submittedDate: row[1],
    email: makeString(row[2]),
    name: makeString(row[3]),
    vendor: makeString(row[5]),
    school: makeString(row[19]),
    status: makeString(row[20]),
  };

  if (!request.id) {  
    request.id = request.submittedDate.getTime().toString(); // Fallback to timestamp if ID is missing
  }

  const reqType = row[4].indexOf('Translation') !== -1 ? 'Translation' :
                  row[4].indexOf('Interpretation') !== -1 ? 'Interpretation' :
                  'Other';
  request.reqType = reqType;
  
  if (request.reqType === 'Translation') {
    request.originalLanguage = makeString(row[6]);
    request.targetLanguage = makeString(row[7]);
    request.requestDate = row[8];
    request.docPageCount = row[9];
    request.description = makeString(row[10]);
    request.docLink = makeString(row[11]);
  } else if (request.reqType === 'Interpretation') {
    request.originalLanguage = makeString(row[12]);
    request.targetLanguage = makeString(row[13]);
    request.requestDate = row[14];
    request.startTime = row[15];
    request.endTime = row[16];
    request.eventLocation = makeString(row[17]);
    request.description = makeString(row[18]);
  } 

  return request
}

function getRequestById(id, requests) {
  return requests.find((request) => request.id === id);
}

function addRequest(request) {
  request.id = generateUniqueId();
  requests.push(request);
}

function updateRequestProperty(id, propName, propValue) {
  const requests = loadRequestsFromSpreadsheet();
  const request = getRequestById(id, requests);
  const requestRowIndex = requests.findIndex((req) => req.id === id) + 2; // +2 to account for header row and 0-based index
  if (request) {
    request[propName] = propValue;
  }
  saveRequestToSpreadsheet(request);
  return JSON.stringify(request);
}

function saveRequestToSpreadsheet(request, rowIndex) {
  if (!request) {
    console.error('No request provided to saveRequestToSpreadsheet');
    return;
  }

  if (!rowIndex) {  
    const requests = loadRequestsFromSpreadsheet();
    const existingRequestIndex = requests.findIndex((req) => req.id === request.id);
    if (existingRequestIndex !== -1) {
      rowIndex = existingRequestIndex + 2; // +2 to account for header row and 0-based index
    } else {
      rowIndex = requests.length + 2; // New row at the end of the sheet
      request.id = generateUniqueId();
    }
  }
  
  const requestRow = makeRequestRow(request);
  const sheet = SpreadsheetApp.openById(FORM_SPREADSHEET_ID).getSheetByName('Form Responses 1');
  sheet.getRange(rowIndex, 1, 1, requestRow.length).setValues([requestRow]);
}

function generateUniqueId() {
  return 'req_' + Math.random().toString(36).substr(2, 9);
} 

function makeRequestRow(request) {
  if (!request) {
    return null;   
  }

  const row = [];
  row[0] = makeString(request.id);
  row[1] = request.submittedDate || new Date();
  row[2] = makeString(request.email);
  row[3] = makeString(request.name);
  row[4] = makeString(request.reqType);
  row[5] = makeString(request.vendor);
  row[6] = makeString(request.originalLanguage);
  row[7] = makeString(request.newLanguage);
  row[8] = request.requestDate;
  row[9] = makeString(request.docPageCount);
  row[10] = makeString(request.description);
  row[11] = makeString(request.docLink);
  row[12] = makeString(request.originalLanguage);
  row[13] = makeString(request.newLanguage);
  row[14] = request.requestDate;
  row[15] = request.startTime;
  row[16] = request.endTime;
  row[17] = makeString(request.eventLocation);
  row[18] = makeString(request.description);
  row[19] = makeString(request.school);
  row[20] = makeString(request.status);

  return row;
}

function makeString(value) {
  return value ? value.toString() : '';
}

/**
 * Unified fetcher for AppSheet data.
 * Returns an object with both requests and schools.
 */
function getDataFromAppSheet() {
  try {
    const requests = getRequestsFromAppSheet();
    const schools = getSchoolsFromAppSheet();
    return {
      requests: requests,
      schools: schools
    };
  } catch (e) {
    console.error('Error in getDataFromAppSheet:', e);
    throw e;
  }
}

function getRequestsFromAppSheet() {
  const appId = '91a940b5-eb26-40ad-bb32-0b17fde4fd39';
  const accessKey = 'V2-ioFEK-BVXmK-tg94D-i0iT8-uK2FM-xvsSM-PPVt4-PIMF4';
  const tableName = 'Requests';
  
  const url = `https://api.appsheet.com/api/v2/apps/${appId}/tables/${tableName}/Action`;
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': accessKey },
    payload: JSON.stringify({
      "Action": "Find",
      "Properties": { "Locale": "en-US" },
      "Rows": []
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data && Array.isArray(data)) {
    return data.map(mapAppSheetRequest);
  }
  return [];
}

function getSchoolsFromAppSheet() {
  const appId = '91a940b5-eb26-40ad-bb32-0b17fde4fd39';
  const accessKey = 'V2-ioFEK-BVXmK-tg94D-i0iT8-uK2FM-xvsSM-PPVt4-PIMF4';
  const tableName = 'Locations';
  
  const url = `https://api.appsheet.com/api/v2/apps/${appId}/tables/${tableName}/Action`;
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': accessKey },
    payload: JSON.stringify({
      "Action": "Find",
      "Properties": { "Locale": "en-US" },
      "Rows": []
    }),
    muteHttpExceptions: true
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());
  
  if (data && Array.isArray(data)) {
    return data.map(row => row.Name || row.name || ''); // Adjust based on AppSheet column name
  }
  return [];
}

/**
 * Maps an AppSheet row object to the application's internal Request object structure.
 */
function mapAppSheetRequest(row) {
  return {
    id: makeString(row.ID || row.id),
    submittedDate: row.SubmittedDate || row.submitted_date,
    email: makeString(row.Email || row.email),
    name: makeString(row.Name || row.name),
    vendor: makeString(row.Vendor || row.vendor),
    school: makeString(row.School || row.school),
    status: makeString(row.Status || row.status),
    reqType: makeString(row.RequestType || row.request_type),
    originalLanguage: makeString(row.OriginalLanguage || row.original_language),
    targetLanguage: makeString(row.TargetLanguage || row.target_language),
    requestDate: row.RequestDate || row.request_date,
    docPageCount: row.DocPageCount || row.doc_page_count,
    description: makeString(row.Description || row.description),
    docLink: makeString(row.DocLink || row.doc_link),
    startTime: row.StartTime || row.start_time,
    endTime: row.EndTime || row.end_time,
    eventLocation: makeString(row.EventLocation || row.event_location)
  };
}