const FORM_SPREADSHEET_ID = '1aA8fmn-GEcXQzT7HyB77taIaIO8pfRDu8UW1WQIXdDc';

function doGet() {
  const activeUserEmail = Session.getActiveUser().getEmail();

  // Check domain restriction
  const isAuthorizedDomain = activeUserEmail.toLowerCase().endsWith('@walpole.k12.ma.us');

  if (!isAuthorizedDomain) {
    console.warn('Unauthorized domain access attempt:', activeUserEmail);
    return HtmlService.createHtmlOutputFromFile('forbidden')
      .setTitle('Access Denied')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  const user = getUser(activeUserEmail);
  console.log('Active user email:', activeUserEmail);
  console.log('User object:', user);

  if (!user) {
    return HtmlService.createHtmlOutputFromFile('forbidden')
      .setTitle('Access Denied')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }

  return HtmlService.createHtmlOutputFromFile('index');
}

function getDataFromServer() {
  const data = getDataFromAppSheet();
  Logger.log(data);
  return data;
}