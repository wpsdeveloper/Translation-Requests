import { vi } from 'vitest';

/**
 * Polyfill for CSSStyleSheet and adoptedStyleSheets which are often 
 * missing or incomplete in JSDOM.
 */
if (typeof window !== 'undefined' && !('adoptedStyleSheets' in Document.prototype)) {
  (window as any).CSSStyleSheet = class {
    replaceSync() {}
    replace() { return Promise.resolve(); }
  };
  (Document.prototype as any).adoptedStyleSheets = [];
  (ShadowRoot.prototype as any).adoptedStyleSheets = [];
}

/**
 * Mock for google.script.run to prevent "google is not defined" 
 * errors during tests.
 */
(globalThis as any).google = {
  script: {
    run: {
      withSuccessHandler: vi.fn().mockReturnThis(),
      withFailureHandler: vi.fn().mockReturnThis(),
      getDataFromServer: vi.fn(),
      saveDataToServer: vi.fn(),
      getUsersData: vi.fn(),
      saveUser: vi.fn()
    }
  }
};
