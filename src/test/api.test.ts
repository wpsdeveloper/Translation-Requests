import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as api from '../client/services/api';
import { hydrate } from '../client/services/api';

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
        reqType: 'Translation',
      } as any;

      const hydrated = api.hydrate(raw);

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

      const hydrated = api.hydrate(raw);

      expect(hydrated.requestDate).toBeNull();
      expect(hydrated.submittedDate).toBeNull();
    });
  });

  describe('saveRequest', () => {
    beforeEach(() => {
      vi.stubGlobal('location', { href: 'https://script.google.com/test' });

      // 2. Setup the "Fluent API" mock for Google
      // We return 'this' (mockRun) so the chaining .withSuccessHandler().withFailureHandler() works
      const mockRun = {
        withSuccessHandler: vi.fn().mockReturnThis(),
        withFailureHandler: vi.fn().mockReturnThis(),
        saveDataToServer: vi.fn(),
      };

      vi.stubGlobal('google', { script: { run: mockRun } });
    });

    it('should dehydrate Translation dates correctly', async () => {
      const rich = {
        reqType: 'Translation',
        requestDate: new Date('2023-10-25T12:00:00Z'),
      } as any;

      // We don't await yet because the promise only resolves
      // when we manually trigger the success handler below.
      const savePromise = api.saveRequest(rich);

      const mockRun = (globalThis as any).google.script.run;

      // 3. Inspect the "Spy history" (mock.calls[0][0])
      // Using the cleaner 'toHaveBeenCalledWith' syntax
      expect(mockRun.saveDataToServer).toHaveBeenCalledWith(
        expect.objectContaining({
          requestDate: '10/25/2023', // Or whatever dehydrateDate returns
        })
      );

      // 4. Manually trigger the success callback to resolve the promise
      const successCallback = mockRun.withSuccessHandler.mock.calls[0][0];
      successCallback(rich);

      await expect(savePromise).resolves.toBeDefined();
    });
  });
});
