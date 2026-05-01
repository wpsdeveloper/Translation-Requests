function getRequests(filter = 'all') {
  const allRequests = loadRequestsFromSpreadsheet();
  if (filter === 'all') {
    return allRequests;
  }
  return allRequests.filter((request) => request.school === filter);  
}

function getRequestById(id) {
  return requests.find((request) => request.id === id);
}

function addRequest(request) {
  request.id = generateUniqueId();
  requests.push(request);
}

function generateUniqueId() {
  return 'req_' + Math.random().toString(36).substr(2, 9);
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
    const row = sheetRows[i];
    console.log(row, row[2]);
    if ((typeof row[2] === "number") || (row[2].indexOf('@') === -1)) {
      continue; // Skip rows where the email column doesn't contain an '@' symbol
    }
    const request = {
      id: row[0],
      submittedDate: row[1],
      email: row[2],
      name: row[3],
      vendor: row[5],
      school: row[19],
      status: row[20],
    };

    if (!request.id) {  
      request.id = request.submittedDate.getTime().toString(); // Fallback to timestamp if ID is missing
    }

    const reqType = row[4].indexOf('translation') !== -1 ? 'Translation' :
                    row[4].indexOf('Interpret') !== -1 ? 'Interpretation' :
                    'Other';
    request.reqType = reqType;
    
    if (request.reqType === 'Translation') {
      request.originalLanguage = row[6] ;
      request.newLanguage = row[7] ;
      request.requestDate = row[8];
      request.docPageCount = row[9];
      request.description = row[10];
      request.docLink = row[11];
    } else if (request.reqType === 'Interpretation') {
      request.originalLanguage = row[12] ;
      request.newLanguage = row[13] ;
      request.requestDate = row[14];
      request.startTime = row[15];
      request.endTime = row[16];
      request.eventLocation = row[17];
      request.description = row[18];
    } 
    
    requests.push(request);
  }
  
  return requests;
} 