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
  },

  get TranslationFolderId(): string {
    return this.get('TRANSLATION_FOLDER_ID') || '1KCCnq9VxHvsio79q4zte-gdVGQtHW0gRPW4Rihho4JQ6gE5E5wJkV1jCZm1jEAn0rb0GcoEw';
  },

  get NotificationTestEmail(): string {
    return this.get('NOTIFICATION_TEST_EMAIL') || 'wpsdeveloper@walpole.k12.ma.us';
  },

  get DevMode(): boolean {
    const val = this.get('DEV_MODE');
    // If the property is missing or not explicitly set to 'false', default to true for safety
    return val !== 'false';
  },
};
