const fs = require('fs');
const path = require('path');
require('dotenv').config();

const envVars = {
  APPSHEET_APP_ID: process.env.APPSHEET_APP_ID,
  APPSHEET_ACCESS_KEY: process.env.APPSHEET_ACCESS_KEY,
  FORM_SPREADSHEET_ID: process.env.FORM_SPREADSHEET_ID
};

const missing = Object.entries(envVars).filter(([k, v]) => !v);
if (missing.length > 0) {
  console.error('Error: Missing environment variables in .env:', missing.map(([k]) => k).join(', '));
  process.exit(1);
}

const bootstrapContent = `
/**
 * AUTO-GENERATED BOOTSTRAP FUNCTION
 * Run this function once in the Google Apps Script editor to set your script properties.
 * After running, you can delete this file or it will be overwritten by the sync script.
 */
function dev_bootstrap_properties() {
  const props = ${JSON.stringify(envVars, null, 2)};
  PropertiesService.getScriptProperties().setProperties(props);
  console.log('Script properties updated successfully!');
}
`;

fs.writeFileSync(path.join(__dirname, '../src/server/bootstrap.ts'), bootstrapContent);
console.log('Successfully generated src/server/bootstrap.ts');
console.log('1. Run "npm run deploy" to push this function to the server.');
console.log('2. Open the GAS IDE and run the "dev_bootstrap_properties" function.');
