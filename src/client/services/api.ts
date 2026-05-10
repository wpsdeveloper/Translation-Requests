import { AppUser, RawRequest, TranslationRequest } from '../../shared/types';

// Determine if we are running in a local environment or inside Google Apps Script.
// This allows us to use mock data for faster frontend development.
const IS_MOCK = !window.location.href.includes('google') && !window.location.href.includes('script');

// Safety proxy for local development to prevent 'google is not defined' errors
if (IS_MOCK && typeof (window as any).google === 'undefined') {
  (window as any).google = {
    script: {
      run: {
        withSuccessHandler: function () { return this; },
        withFailureHandler: function () { return this; },
        getDataFromServer: function () { console.warn('google.script.run.getRequestsFromAppSheet called in mock mode'); },
        saveDataToServer: function () { console.warn('google.script.run.saveDataToServer called in mock mode'); }
      }
    }
  };
}

export interface FetchDataResult {
  requests: TranslationRequest[];
  schools: string[];
  user: AppUser | null;
}

/**
 * Main data fetcher. 
 * Orchestrates either dynamic mock loading or calling the GAS server via google.script.run.
 */
export const fetchData = (): Promise<FetchDataResult> => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      import('./mock-data').then((module) => {
        console.log('Mock data loaded dynamically');
        const data = JSON.parse(module.getMockData());
        const cleanRequests = (data.requests as RawRequest[]).map(hydrate);
        setTimeout(() => resolve({ requests: cleanRequests, schools: data.schools, user: null }), 1500);
      });
      return;
    }
    google.script.run
      .withSuccessHandler((data: any) => {
        console.log('Data received from server:', data);
        const requests = (data.requests || []) as RawRequest[];
        const schools = (data.schools || []) as string[];
        const user = (data.user || null) as AppUser | null;
        const cleanRequests = requests.map(hydrate);
        resolve({ requests: cleanRequests, schools: schools, user: user });
      })
      .withFailureHandler((err: Error) => {
        console.error('Server error:', err);
        reject(err);
      })
      .getDataFromServer();
  });
};

/**
 * Saves changes to a request.
 * This function "de-hydrates" the object (converts Dates back to strings) 
 * to match the AppSheet API's expected format.
 */
export const saveRequest = (updatedData: TranslationRequest): Promise<TranslationRequest> => {
  // Create a copy and convert Dates back to ISO strings or formatted strings for the server
  const dataToSend: RawRequest = {
    ...(updatedData as any),
    requestDate: updatedData.requestDate instanceof Date ? updatedData.requestDate.toISOString() : updatedData.requestDate || "",
    submittedDate: updatedData.submittedDate instanceof Date ? updatedData.submittedDate.toISOString() : updatedData.submittedDate || "",
    approvedDate: updatedData.approvedDate instanceof Date ? updatedData.approvedDate.toISOString() : updatedData.approvedDate || "",
    startTime: updatedData.startTime instanceof Date ? updatedData.startTime.toISOString() : updatedData.startTime || "",
    endTime: updatedData.endTime instanceof Date ? updatedData.endTime.toISOString() : updatedData.endTime || "",
  };

  console.log('Saving request to server (de-hydrated):', dataToSend);

  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((serverResult: any) => {
        console.log('Server save successful:', serverResult);
        // Resolve with the original updatedData so the UI keeps its clean properties
        resolve(updatedData);
      })
      .withFailureHandler(reject)
      .saveDataToServer(dataToSend);
  });
};

/**
 * Admin: Fetch all users from the system.
 */
export const fetchAllUsers = (): Promise<AppUser[]> => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      resolve([
        { email: 'admin@walpole.k12.ma.us', name: 'Admin User', role: 'Admin', schools: [] },
        { email: 'user@walpole.k12.ma.us', name: 'Standard User', role: 'User', schools: ['Walpole High'] }
      ]);
      return;
    }
    google.script.run
      .withSuccessHandler((users: any) => resolve(users as AppUser[]))
      .withFailureHandler(reject)
      .getUsersData();
  });
};

/**
 * Admin: Add, Edit, or Delete a user.
 */
export const saveUserData = (userData: AppUser, action: string): Promise<AppUser> => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      console.log(`Mock User ${action}:`, userData);
      setTimeout(() => resolve(userData), 1000);
      return;
    }
    google.script.run
      .withSuccessHandler((result: any) => resolve(result as AppUser))
      .withFailureHandler(reject)
      .saveUser(userData, action);
  });
};

/**
 * Hydration: Converts a "Raw" data object (from the API) into a "Clean" application 
 * object. This primarily involves turning ISO date strings into real JS Date objects,
 * which are much easier to format and manipulate in the UI.
 */
export function hydrate(request: RawRequest): TranslationRequest {
  return {
    ...request,
    requestDate: request.requestDate ? new Date(request.requestDate) : null,
    submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
    approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
    startTime: request.startTime ? new Date(request.startTime) : null,
    endTime: request.endTime ? new Date(request.endTime) : null,
  };
}
