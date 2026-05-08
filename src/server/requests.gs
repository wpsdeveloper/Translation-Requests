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
    school: makeString(row.School || row.school),
    status: makeString(row.Status || row.status),
    reqType: makeString(row.RequestType || row.request_type),
    originalLanguage: makeString(row.OriginalLanguage || row.original_language),
    targetLanguage: makeString(row.TargetLanguage || row.target_language),
    interpretationType: makeString(row.InterpretationType || row.interpretation_type),
    requestDate: row.RequestDate || row.request_date,
    docPageCount: row.DocPageCount || row.doc_page_count,
    description: makeString(row.Description || row.description),
    docLink: makeString(row.DocLink || row.doc_link),
    startTime: row.StartTime || row.start_time,
    endTime: row.EndTime || row.end_time,
    eventLocation: makeString(row.EventLocation || row.event_location),
    contractor: makeString(row.Contractor || row.contractor),
    contractorName: makeString(row.ContractorName || row.contractor_name),
    approverName: makeString(row.ApproverName || row.approver_name),
    approvedDate: row.ApprovedDate || row.approved_date,
  };
}