import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hydrate, saveRequest } from '../client/services/api';
import { RawRequest, TranslationRequest } from '../shared/types';

describe('api.ts', () => {
  beforeEach(() => {
    // Reset the global google mock
    (globalThis as any).google = {
      script: {
        run: {
          withSuccessHandler: vi.fn().mockReturnThis(),
          withFailureHandler: vi.fn().mockReturnThis(),
          getDataFromServer: vi.fn(),
          saveDataToServer: vi.fn(),
        },
      },
    };
  });

  describe('hydrate', () => {
    it('should convert ISO strings to Date objects', () => {
      const raw: RawRequest = {
        id: '1',
        requestDate: '2023-10-25T12:00:00Z',
        submittedDate: '2023-10-20T10:00:00Z',
        status: 'Approved',
        name: 'John',
        school: 'High School',
        reqType: 'Translation'
      } as any;

      const hydrated = hydrate(raw);

      expect(hydrated.requestDate).toBeInstanceOf(Date);
      expect(hydrated.requestDate?.toISOString()).toBe('2023-10-25T12:00:00.000Z');
      expect(hydrated.submittedDate).toBeInstanceOf(Date);
    });

    it('should handle null or empty dates', () => {
      const raw: RawRequest = {
        id: '1',
        requestDate: '',
        submittedDate: null,
      } as any;

      const hydrated = hydrate(raw);

      expect(hydrated.requestDate).toBeNull();
      expect(hydrated.submittedDate).toBeNull();
    });
  });

  describe('saveRequest', () => {
    it('should convert Date objects back to strings when saving', async () => {
      const rich: TranslationRequest = {
        id: '1',
        requestDate: new Date('2023-10-25T12:00:00Z'),
        status: 'Approved',
        name: 'John'
      } as any;

      const savePromise = saveRequest(rich);
      
      // Get the mock call to saveDataToServer
      const mockRun = (globalThis as any).google.script.run;
      const sentData = mockRun.saveDataToServer.mock.calls[0][0];

      expect(typeof sentData.requestDate).toBe('string');
      expect(sentData.requestDate).toContain('2023-10-25');
    });
  });
});
