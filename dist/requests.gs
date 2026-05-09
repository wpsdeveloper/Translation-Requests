const APPSHEET_APP_ID = '91a940b5-eb26-40ad-bb32-0b17fde4fd39';
const APPSHEET_ACCESS_KEY = 'V2-ioFEK-BVXmK-tg94D-i0iT8-uK2FM-xvsSM-PPVt4-PIMF4';

/**
 * Unified fetcher for AppSheet data.
 * Returns an object with both requests and schools.
 */
function getDataFromAppSheet(user) {
  try {
    const rawRequests = getRequestsFromAppSheet();
    const schools = getSchoolsFromAppSheet();
    
    // Role-based filtering
    let filteredRequests = rawRequests;
    if (user.role !== 'Admin') {
      const userSchools = user.schools || [];
      filteredRequests = rawRequests.filter(req => userSchools.includes(req.school));
    }

    return {
      requests: filteredRequests,
      schools: schools
    };
  } catch (e) {
    console.error('Error in getDataFromAppSheet:', e);
    throw e;
  }
}

function getRequestsFromAppSheet() {
  const tableName = 'Requests';

  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': APPSHEET_ACCESS_KEY },
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
  const tableName = 'Locations';

  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': APPSHEET_ACCESS_KEY },
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
  const activeUserEmail = Session.getActiveUser().getEmail();
  const user = getUser(activeUserEmail);
  
  if (!user) {
    throw new Error('Access Denied: User not found in authorized database.');
  }

  // 1. School authorization check (Admins see everything)
  if (user.role !== 'Admin') {
    const userSchools = user.schools || [];
    if (!userSchools.includes(updatedData.school)) {
      throw new Error(`Permission Denied: You are not authorized to edit records for ${updatedData.school}.`);
    }
  }

  // 2. Status restriction check for 'User' role
  if (user.role === 'User') {
    // Fetch the existing record to check its current status
    const rawRequests = getRequestsFromAppSheet();
    const existingRecord = rawRequests.find(r => r.id === updatedData.id);
    
    if (existingRecord) {
      const oldStatus = existingRecord.status;
      const newStatus = updatedData.status;
      
      if (oldStatus === 'Needs Approval' && newStatus !== 'Needs Approval') {
        throw new Error('Permission Denied: Users cannot change the status away from "Needs Approval".');
      }
    }
  }

  const tableName = 'Requests';
  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;

  // Map the clean JS object back to AppSheet's column names
  const appSheetRow = mapRequestToAppSheet(updatedData);

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': APPSHEET_ACCESS_KEY },
    payload: JSON.stringify({
      "Action": "Edit", 
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

/**
 * Fetches users from the AppSheet 'Users' table.
 */
function getUsersFromAppSheet() {
  const tableName = 'Users';

  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': APPSHEET_ACCESS_KEY },
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
    return data.map(row => {
      const user = { ...row }; // Keep all original AppSheet columns
      user.email = makeString(row["Email"] || row["email"]).trim();
      user.name = makeString(row["Name"] || row["name"]);
      user.role = makeString(row["Role"] || row["role"]) || 'User';
      user.schools = makeString(row["Schools"] || row["schools"]).split(',').map(s => s.trim()).filter(s => s);
      return user;
    });
  }
  return [];
}

/**
 * Maps internal user object to AppSheet column names.
 */
function mapUserToAppSheet(user) {
  const row = { ...user };
  
  // Ensure the standard columns are correctly formatted
  row["Email"] = makeString(user.email).trim();
  row["Name"] = makeString(user.name);
  row["Role"] = makeString(user.role);
  row["Schools"] = Array.isArray(user.schools) ? user.schools.join(', ') : makeString(user.schools);
  
  // Remove the "clean" properties we added for our internal JS use
  delete row.email;
  delete row.name;
  delete row.role;
  delete row.schools;
  
  return row;
}

/**
 * Performs Add, Edit, or Delete actions on the 'Users' table in AppSheet.
 */
function saveUserToAppSheet(userData, action) {
  const tableName = 'Users';
  const url = `https://api.appsheet.com/api/v2/apps/${APPSHEET_APP_ID}/tables/${tableName}/Action`;

  const emailValue = makeString(userData.email || userData.Email).trim();
  
  // For Delete, send the full object to ensure we include any hidden keys (like _RowNumber)
  // but also include explicit Email/email keys just in case.
  let appSheetRow;
  if (action === 'Delete') {
    appSheetRow = mapUserToAppSheet(userData);
  } else {
    appSheetRow = mapUserToAppSheet(userData);
  }

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'ApplicationAccessKey': APPSHEET_ACCESS_KEY },
    payload: JSON.stringify({
      "Action": action,
      "Properties": { "Locale": "en-US" },
      "Rows": [appSheetRow]
    }),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const responseCode = response.getResponseCode();

  Logger.log(`User ${action} - HTTP ${responseCode}: ${responseText}`);
  
  if (responseCode !== 200) {
    let errorMsg = `AppSheet Error (${responseCode})`;
    if (responseText) {
      errorMsg += `: ${responseText}`;
    }
    throw new Error(errorMsg);
  }

  try {
    return responseText ? JSON.parse(responseText) : { success: true };
  } catch (e) {
    return { success: true };
  }
}
