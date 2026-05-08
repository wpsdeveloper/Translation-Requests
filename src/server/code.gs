const FORM_SPREADSHEET_ID = '1aA8fmn-GEcXQzT7HyB77taIaIO8pfRDu8UW1WQIXdDc';

function doGet() {
  const activeUserEmail = Session.getActiveUser().getEmail();
  const user = getUser(activeUserEmail); // Ensure user exis
  console.log('Active user email:', activeUserEmail);
  console.log('User object:', user);
  if (!user) {
    return HtmlService.createHtmlOutput('Access Denied: You do not have permission to access this application.');
  }
  
  return HtmlService.createHtmlOutputFromFile('index');
}

function getDataFromServer() {
  const data = getDataFromAppSheet();
  Logger.log(data);
  return JSON.stringify(data);
}