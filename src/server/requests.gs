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
  Logger.log(row); // Keep this to verify the exact names in your logs!
  
  return {
    id: makeString(row["ID"] || row["id"]),
    // Check for spaces using bracket notation
    email: makeString(row["Requester Email"] || row["RequesterEmail"] || row["requester_email"]),
    name: makeString(row["Requester Name"] || row["RequesterName"] || row["requester_name"]),
    school: makeString(row["School"] || row["school"]),
    status: makeString(row["Status"] || row["status"]),
    reqType: makeString(row["Request Type"] || row["RequestType"] || row["request_type"]),
    originalLanguage: makeString(row["Language Original"] || row["LanguageOriginal"] || row["language_original"]),
    targetLanguage: makeString(row["Language Target"] || row["LanguageTarget"] || row["language_target"]),
    interpretationType: makeString(row["Interpretation Type"] || row["InterpretationType"] || row["interpretation_type"]),
    docPageCount: makeString(row["Page Count"] || row["PageCount"] || row["page_count"]),
    description: makeString(row["Description"] || row["description"]),
    docLink: makeString(row["Document Link"] || row["DocumentLink"] || row["document_link"]),
    eventLocation: makeString(row["Event Location"] || row["EventLocation"] || row["event_location"]),
    contractor: makeString(row["Contractor"] || row["contractor"]),
    contractorName: makeString(row["Contractor Name"] || row["contractor_name"]),
    approverName: makeString(row["Approver Name"] || row["approver_name"]),
    requestDate: makeString(row["Date Needed"] || row["DateNeeded"] || row["date_needed"]),
    approvedDate: makeString(row["Approved Date"] || row["approved_date"]),
    submittedDate: makeString(row["Submitted Date"] || row["SubmittedDate"] || row["submitted_date"]),
    endTime: makeString(row["End Time"] || row["EndTime"] || row["end_time"]),
    startTime: makeString(row["Start Time"] || row["StartTime"] || row["start_time"]),
  };
}


function makeString(value) {
  return value ? value.toString() : '';
}