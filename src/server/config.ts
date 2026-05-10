/**
 * Configuration service to manage script properties securely.
 * This replaces hardcoded constants with values from PropertiesService.
 */
const Config = {
  get(key: string): string {
    const value = PropertiesService.getScriptProperties().getProperty(key);
    if (!value) {
      console.warn(`Configuration key "${key}" is missing. Please set it in Script Properties.`);
      return '';
    }
    return value;
  },

  get AppSheetAppId(): string {
    return this.get('APPSHEET_APP_ID');
  },

  get AppSheetAccessKey(): string {
    return this.get('APPSHEET_ACCESS_KEY');
  },

  get FormSpreadsheetId(): string {
    return this.get('FORM_SPREADSHEET_ID');
  }
};
