function getUser(email) {
  const users = getUsers();
  const user = users.find(user => user.email === email);
  if (typeof user === 'undefined') {
    return null;
  }
  return user;  
}

function getUsers() {
  const spreadsheet = SpreadsheetApp.openById(FORM_SPREADSHEET_ID);
  const sheet = spreadsheet.getSheetByName('Users');
  const sheetRows = sheet.getDataRange().getValues();
  
  // Assuming the first row is headers
  const headers = sheetRows[0];
  const users = parseUsersFromSheet(sheetRows);
  
  return users;
}

function parseUsersFromSheet(sheetRows) {
  const users = [];
  
  for (let i = 1; i < sheetRows.length; i++) {
    const row = sheetRows[i];
    const user = {
      email: row[0],
      name: row[1],
      role: row[2],
      schools: row[3] ? row[3].split(',').map(s => s.trim()) : [],
    };
    
    users.push(user);
  }
  
  return users;
}