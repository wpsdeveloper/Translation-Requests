/**
 * requests.gs: Handles all communication with the AppSheet REST API.
 *
 * Note: In Google Apps Script, all top-level functions are in the global scope.
 * We avoid 'import/export' here to ensure compatibility with the GAS runtime.
 */

/**
 * Unified fetcher for AppSheet data.
 * Orchestrates the retrieval of both requests and locations in parallel (conceptual),
 * and applies role-based filtering before sending data to the client.
 */
function getDataFromAppSheet(user: AppUser) {
  try {
    const rawRequests = getRequestsFromAppSheet();
    const schools = getSchoolsFromAppSheet();

    // Role-based filtering
    let filteredRequests = rawRequests;
    if (user.role !== 'Admin') {
      const userSchools = user.schools || [];
      filteredRequests = rawRequests.filter((req) => userSchools.includes(req.school));
    }

    return {
      requests: filteredRequests,
      schools: schools,
    };
  } catch (e) {
    console.error('Error in getDataFromAppSheet:', e);
    throw e;
  }
}

function getRequestsFromAppSheet(): RawRequest[] {
  const tableName = 'Requests';

  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Find',
      Properties: { Locale: 'en-US' },
      Rows: [],
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (data && Array.isArray(data)) {
    return data.map(mapAppSheetRequest);
  }
  return [];
}

function getSchoolsFromAppSheet(): string[] {
  const tableName = 'Locations';

  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Find',
      Properties: { Locale: 'en-US' },
      Rows: [],
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (data && Array.isArray(data)) {
    return data.map((row: any) => row.Name || row.name || '');
  }
  return [];
}

/**
 * Maps an AppSheet row object to the application's internal Request object structure.
 */
/**
 * mapAppSheetRequest: Translates AppSheet's internal row format into our application's
 * typed RawRequest interface. This layer is critical because AppSheet column names
 * often contain spaces or vary between tables.
 */
function mapAppSheetRequest(row: any): RawRequest {
  return {
    id: makeString(row['ID'] || row['id']),
    email: makeString(row['Requester Email'] || row['RequesterEmail'] || row['requester_email']),
    name: makeString(row['Requester Name'] || row['RequesterName'] || row['requester_name']),
    school: makeString(row['School'] || row['school']),
    status: makeString(row['Status'] || row['status']),
    reqType: makeString(row['Request Type'] || row['RequestType'] || row['request_type']),
    originalLanguage: makeString(row['Language Original'] || row['LanguageOriginal'] || row['language_original']),
    targetLanguage: makeString(row['Language Target'] || row['LanguageTarget'] || row['language_target']),
    interpretationType: makeString(
      row['Interpretation Type'] || row['InterpretationType'] || row['interpretation_type']
    ),
    docPageCount: makeString(row['Page Count'] || row['PageCount'] || row['page_count']),
    description: makeString(row['Description'] || row['description']),
    docLink: makeString(row['Document Link'] || row['DocumentLink'] || row['document_link']),
    eventLocation: makeString(row['Event Location'] || row['EventLocation'] || row['event_location']),
    contractor: makeString(row['Contractor'] || row['contractor']),
    contractorName: makeString(row['Contractor Name'] || row['contractor_name']),
    approverName: makeString(row['Approver Name'] || row['approver_name']),
    requestDate: makeString(row['Date Needed'] || row['DateNeeded'] || row['date_needed']),
    approvedDate: makeString(row['Approved Date'] || row['approved_date']),
    submittedDate: makeString(row['Submitted Date'] || row['SubmittedDate'] || row['submitted_date']),
    endTime: makeString(row['End Time'] || row['EndTime'] || row['end_time']),
    startTime: makeString(row['Start Time'] || row['StartTime'] || row['start_time']),

    contractorScheduledDate: makeString(row['Contractor Scheduled Date'] || row['contractor_scheduled_date']),
    documentReturnedDate: makeString(row['Document Returned Date'] || row['document_returned_date']),
    guestConfirmedDate: makeString(row['Guest Confirmed Date'] || row['guest_confirmed_date']),
    techConfirmedDate: makeString(row['Tech Confirmed Date'] || row['tech_confirmed_date']),
  };
}

function makeString(value: any): string {
  return value ? value.toString() : '';
}

/**
 * Server function to update a request in AppSheet.
 */
function saveDataToServer(updatedData: RawRequest) {
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
    const existingRecord = rawRequests.find((r) => r.id === updatedData.id);

    if (existingRecord) {
      const oldStatus = existingRecord.status;
      const newStatus = updatedData.status;

      if (oldStatus === 'Needs Approval' && newStatus !== 'Needs Approval') {
        throw new Error('Permission Denied: Users cannot change the status away from "Needs Approval".');
      }
    }
  }

  const tableName = 'Requests';
  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  // Map the clean JS object back to AppSheet's column names
  const appSheetRow = mapRequestToAppSheet(updatedData);

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Edit',
      Properties: {
        Locale: 'en-US',
      },
      Rows: [appSheetRow],
    }),
    muteHttpExceptions: true,
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
 * Server function to add a new request to AppSheet.
 */
function addRequestToServer(data: RawRequest) {
  const activeUserEmail = Session.getActiveUser().getEmail();
  let user = getUser(activeUserEmail);

  // If user is not in DB, we treat them as a virtual 'Guest' user
  // but we still allow them to submit if they are from the domain.
  if (!activeUserEmail.toLowerCase().endsWith('@walpole.k12.ma.us')) {
    throw new Error('Access Denied: Unauthorized domain.');
  }

  // Set defaults for new requests
  data.status = 'Needs Approval';
  data.submittedDate = new Date().toISOString();
  data.id = Utilities.getUuid(); // Generate a unique ID if not provided

  const tableName = 'Requests';
  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  const appSheetRow = mapRequestToAppSheet(data);

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Add',
      Properties: {
        Locale: 'en-US',
      },
      Rows: [appSheetRow],
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`AppSheet Error (${responseCode}): ${responseText}`);
  }

  try {
    // send email notification to approver
    sendNewRequestNotification(data);

    const result = JSON.parse(responseText);
    // AppSheet 'Add' returns the created row(s) in the Rows property of the response
    if (result && result.Rows && result.Rows.length > 0) {
      return mapAppSheetRequest(result.Rows[0]);
    }
    return data; // Fallback to what we sent if parsing fails
  } catch (e) {
    return data;
  }
}

/**
 * Uploads a file to a specific Drive folder and returns the view URL.
 */
function uploadFileToDrive(base64Data: string, fileName: string, mimeType: string) {
  try {
    const folderId = Config.TranslationFolderId;
    const folder = DriveApp.getFolderById(folderId);

    // Extract base64 content
    const splitData = base64Data.split(',');
    const content = splitData.length > 1 ? splitData[1] : splitData[0];
    const decoded = Utilities.base64Decode(content);
    const blob = Utilities.newBlob(decoded, mimeType, fileName);

    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    return file.getUrl();
  } catch (e: any) {
    console.error('File upload failed:', e);
    throw new Error('Failed to upload file to Google Drive: ' + (e?.toString() || 'Unknown error'));
  }
}

/**
 * Maps the internal Request object back to AppSheet's expected column names.
 */
function mapRequestToAppSheet(data: RawRequest) {
  // Helper to format dates for AppSheet (removes T00:00:00.000Z)
  const formatDate = (val: any) => {
    if (!val) return '';
    // If it's an ISO string, just take the date part (YYYY-MM-DD)
    if (typeof val === 'string' && val.includes('T')) return val.split('T')[0];
    return makeString(val);
  };

  const row: any = {};

  row['ID'] = makeString(data.id);
  row['Requester Email'] = makeString(data.email);
  row['Requester Name'] = makeString(data.name);
  row['School'] = makeString(data.school);
  row['Status'] = makeString(data.status);
  row['Request Type'] = makeString(data.reqType);
  row['Language Original'] = makeString(data.originalLanguage);
  row['Language Target'] = makeString(data.targetLanguage);
  row['Interpretation Type'] = makeString(data.interpretationType);
  row['Page Count'] = makeString(data.docPageCount);
  row['Description'] = makeString(data.description);
  row['Document Link'] = makeString(data.docLink);
  row['Event Location'] = makeString(data.eventLocation);
  row['Contractor'] = makeString(data.contractor);
  row['Contractor Name'] = makeString(data.contractorName);
  row['Approver Name'] = makeString(data.approverName);

  // Use the formatDate helper for all date/time fields
  row['Date Needed'] = formatDate(data.requestDate);
  row['Approved Date'] = formatDate(data.approvedDate);
  row['Submitted Date'] = formatDate(data.submittedDate);

  // For times, we might want to keep the time part if it exists
  row['End Time'] = makeString(data.endTime);
  row['Start Time'] = makeString(data.startTime);

  Logger.log('Mapped row for AppSheet: %s', JSON.stringify(row));
  return row;
}

/**
 * Fetches users from the AppSheet 'Users' table.
 */
function getUsersFromAppSheet(): AppUser[] {
  const tableName = 'Users';

  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Find',
      Properties: { Locale: 'en-US' },
      Rows: [],
    }),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const data = JSON.parse(response.getContentText());

  if (data && Array.isArray(data)) {
    return data.map((row: any) => {
      const user: any = { ...row }; // Keep all original AppSheet columns
      user.email = makeString(row['Email'] || row['email']).trim();
      user.name = makeString(row['Name'] || row['name']);
      user.role = makeString(row['Role'] || row['role']) || 'User';
      user.schools = makeString(row['Schools'] || row['schools'])
        .split(',')
        .map((s: string) => s.trim())
        .filter((s: string) => s);
      return user as AppUser;
    });
  }
  return [];
}

/**
 * Maps internal user object to AppSheet column names.
 */
function mapUserToAppSheet(user: AppUser) {
  const row: any = { ...user };

  // Ensure the standard columns are correctly formatted
  row['Email'] = makeString(user.email).trim();
  row['Name'] = makeString(user.name);
  row['Role'] = makeString(user.role);
  row['Schools'] = Array.isArray(user.schools) ? user.schools.join(', ') : makeString(user.schools);

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
function saveUserToAppSheet(userData: AppUser, action: string) {
  const tableName = 'Users';
  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;

  // For Delete, send the full object to ensure we include any hidden keys (like _RowNumber)
  const appSheetRow = mapUserToAppSheet(userData);

  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: action,
      Properties: { Locale: 'en-US' },
      Rows: [appSheetRow],
    }),
    muteHttpExceptions: true,
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

/**
 * Delete a request record from AppSheet.
 * @param recordId The ID of the request to delete.
 */
function deleteRequestFromServer(recordId: string) {
  const activeUserEmail = Session.getActiveUser().getEmail();
  const user = getUser(activeUserEmail);
  if (!user) {
    throw new Error('Access Denied: User not found');
  }
  // Admin can delete any; non-admin must belong to same school
  if (user.role !== 'Admin') {
    const rawRequests = getRequestsFromAppSheet();
    const existing = rawRequests.find((r) => r.id === recordId);
    if (!existing) {
      throw new Error('Record not found');
    }
    const userSchools = user.schools || [];
    if (!userSchools.includes(existing.school)) {
      throw new Error(`Permission Denied: You are not authorized to delete records for ${existing.school}.`);
    }
  }

  const tableName = 'Requests';
  const url = `https://api.appsheet.com/api/v2/apps/${Config.AppSheetAppId}/tables/${tableName}/Action`;
  const appSheetRow = { ID: makeString(recordId) };
  const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
    method: 'post',
    contentType: 'application/json',
    headers: { ApplicationAccessKey: Config.AppSheetAccessKey },
    payload: JSON.stringify({
      Action: 'Delete',
      Properties: { Locale: 'en-US' },
      Rows: [appSheetRow],
    }),
    muteHttpExceptions: true,
  };
  const response = UrlFetchApp.fetch(url, options);
  const responseText = response.getContentText();
  const responseCode = response.getResponseCode();
  if (responseCode !== 200) {
    throw new Error(`AppSheet Delete Error (${responseCode}): ${responseText}`);
  }
  try {
    return JSON.parse(responseText);
  } catch (e) {
    return { success: true };
  }
}
