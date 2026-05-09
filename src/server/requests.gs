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

/**
 * Server function to update a request in AppSheet.
 */
function saveDataToServer(updatedData) {
  const appId = '91a940b5-eb26-40ad-bb32-0b17fde4fd39';
  const accessKey = 'V2-ioFEK-BVXmK-tg94D-i0iT8-uK2FM-xvsSM-PPVt4-PIMF4';
  const tableName = 'Requests';

  const url = `https://api.appsheet.com/api/v2/apps/${appId}/tables/${tableName}/Action`;

  // Map the clean JS object back to AppSheet's column names
  const appSheetRow = mapRequestToAppSheet(updatedData);

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': accessKey },
    payload: JSON.stringify({
      "Action": "Edit", // Use 'Edit' to update an existing row
      "Properties": { "Locale": "en-US" },
      "Rows": [appSheetRow]
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const responseCode = response.getResponseCode();
  Logger.log('Response Code: ' + responseCode);
  Logger.log('Response Text: ' + responseText);
  if (!responseText) {
    throw new Error('AppSheet returned an empty response. HTTP Code: ' + responseCode);
  }
  try {
    const result = JSON.parse(responseText);
    Logger.log('Save result: ' + JSON.stringify(result));
    return result;
  } catch (e) {
    throw new Error('AppSheet returned invalid JSON: ' + responseText);
  }
}

/**
 * Maps the internal Request object back to AppSheet's expected column names.
 */
function mapRequestToAppSheet(data) {
  // Helper to format dates for AppSheet (removes T00:00:00.000Z)
  const formatDate = (val) => {
    if (!val) return "";
    // If it's an ISO string, just take the date part (YYYY-MM-DD)
    if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
    return makeString(val);
  };

  const row = {};

  row["ID"] = makeString(data.id);
  row["Requester Email"] = makeString(data.email);
  row["Requester Name"] = makeString(data.name);
  row["School"] = makeString(data.school);
  row["Status"] = makeString(data.status);
  row["Request Type"] = makeString(data.reqType);
  row["Language Original"] = makeString(data.originalLanguage);
  row["Language Target"] = makeString(data.targetLanguage);
  row["Interpretation Type"] = makeString(data.interpretationType);
  row["Page Count"] = makeString(data.docPageCount);
  row["Description"] = makeString(data.description);
  row["Document Link"] = makeString(data.docLink);
  row["Event Location"] = makeString(data.eventLocation);
  row["Contractor"] = makeString(data.contractor);
  row["Contractor Name"] = makeString(data.contractorName);
  row["Approver Name"] = makeString(data.approverName);

  // Use the formatDate helper for all date/time fields
  row["Date Needed"] = formatDate(data.requestDate);
  row["Approved Date"] = formatDate(data.approvedDate);
  row["Submitted Date"] = formatDate(data.submittedDate);

  // For times, we might want to keep the time part if it exists
  row["End Time"] = makeString(data.endTime);
  row["Start Time"] = makeString(data.startTime);

  Logger.log('Mapped row for AppSheet: %s', JSON.stringify(row));
  return row;
}

