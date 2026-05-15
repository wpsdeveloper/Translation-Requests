import { formatDate, formatTime } from './utils';
// Determine if we are running in a local environment or inside Google Apps Script.
// This allows us to use mock data for faster frontend development.
const IS_MOCK = !window.location.href.includes('google') && !window.location.href.includes('script');

// Safety proxy for local development to prevent 'google is not defined' errors
if (IS_MOCK && typeof (window as any).google === 'undefined') {
  (window as any).google = {
    script: {
      run: {
        withSuccessHandler: function () {
          return this;
        },
        withFailureHandler: function () {
          return this;
        },
        getDataFromServer: function () {
          console.warn('google.script.run.getRequestsFromAppSheet called in mock mode');
        },
        addRequestToServer: function () {
          console.warn('google.script.run.addRequestToServer called in mock mode');
        },
        saveDataToServer: function () {
          console.warn('google.script.run.saveDataToServer called in mock mode');
        },
      },
    },
  };
}

/**
 * Helper to convert Date objects back to ISO strings for the server,
 * or return an empty string if null/undefined.
 */
const dehydrateDate = (date: Date | string | null | undefined): string => {
  if (date instanceof Date) return formatDate(date, 'MM/DD/YYYY');
  return '';
};

const dehydrateDateTime = (date: Date | string | null | undefined): string => {
  if (date instanceof Date) return date.toISOString();
  return '';
};

const dehydrateTime = (date: Date | string | null | undefined): string => {
  if (date instanceof Date) return formatTime(date, 'h:mm A');
  if (typeof date === 'string') {
    if (/^\d{2}:\d{2}:\d{2}$/.test(date)) return date;
    if (/^\d{2}:\d{2}$/.test(date)) return `${date}:00`;
    const ampmMatch = date.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampmMatch) {
      let [, h, m, ampm] = ampmMatch;
      let hours = parseInt(h, 10);
      if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
      if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, '0')}:${m}:00`;
    }
    return date;
  }
  return '';
};

const hydrateDate = (value: string | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;
  try {
    const newDate = new Date(value);
    if (isNaN(newDate.getTime())) return null;
    return newDate;
  } catch {
    return null;
  }
};

export interface FetchDataResult {
  requests: HydratedRequest[];
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
        const user = (data.user || null) as AppUser | null;
        setTimeout(() => resolve({ requests: cleanRequests, schools: data.schools, user: user }), 1500);
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
export const saveRequest = (updatedData: HydratedRequest): Promise<HydratedRequest> => {
  // Create a copy and convert Dates back to ISO strings or formatted strings for the server
  let dataToSend: RawTranslationRequest | RawInterpretationRequest;
  if (updatedData.reqType === 'Translation') {
    const translationRequest = updatedData as TranslationRequest;
    dataToSend = {
      ...translationRequest,
      requestDate: dehydrateDate(translationRequest.requestDate),
      submittedDate: dehydrateDate(translationRequest.submittedDate),
      approvedDate: dehydrateDate(translationRequest.approvedDate),
      documentReturnedDate: dehydrateDate(translationRequest.documentReturnedDate),
      contractorScheduledDate: dehydrateDate(translationRequest.contractorScheduledDate),
    } as RawTranslationRequest;
  } else {
    const interpretationRequest = updatedData as InterpretationRequest;
    dataToSend = {
      ...interpretationRequest,
      requestDate: dehydrateDate(interpretationRequest.requestDate),
      submittedDate: dehydrateDateTime(interpretationRequest.submittedDate),
      approvedDate: dehydrateDateTime(interpretationRequest.approvedDate),
      startTime: dehydrateTime(interpretationRequest.startTime),
      endTime: dehydrateTime(interpretationRequest.endTime),
      contractorScheduledDate: dehydrateDate(interpretationRequest.contractorScheduledDate),
      guestConfirmedDate: dehydrateDate(interpretationRequest.guestConfirmedDate),
      techConfirmedDate: dehydrateDate(interpretationRequest.techConfirmedDate),
    } as RawInterpretationRequest;
  }

  console.log('Saving request to server (de-hydrated):', dataToSend);

  if (IS_MOCK) {
    console.warn('google.script.run.saveDataToServer called in mock mode');
    return new Promise((resolve) => setTimeout(() => resolve(updatedData), 1500));
  }

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
 * Adds a new request to the server.
 */
export const addRequest = (newData: HydratedRequest): Promise<HydratedRequest> => {
  let dataToSend: RawTranslationRequest | RawInterpretationRequest;
  if (newData.reqType === 'Translation') {
    dataToSend = {
      ...(newData as any),
      requestDate: dehydrateDate(newData.requestDate),
      submittedDate: dehydrateDate(newData.submittedDate),
      approvedDate: dehydrateDate(newData.approvedDate),
      contractorScheduledDate: dehydrateDate(newData.contractorScheduledDate),
      documentReturnedDate: dehydrateDate(newData.documentReturnedDate),
    } as RawTranslationRequest;
  } else {
    dataToSend = {
      ...(newData as any),
      requestDate: dehydrateDate(newData.requestDate),
      submittedDate: dehydrateDateTime(newData.submittedDate),
      approvedDate: dehydrateDateTime(newData.approvedDate),
      startTime: dehydrateTime(newData.startTime),
      endTime: dehydrateTime(newData.endTime),
      contractorScheduledDate: dehydrateDate(newData.contractorScheduledDate),
      guestConfirmedDate: dehydrateDate(newData.guestConfirmedDate),
      techConfirmedDate: dehydrateDate(newData.techConfirmedDate),
    } as RawInterpretationRequest;
  }

  if (IS_MOCK) {
    console.warn('google.script.run.addRequestToServer called in mock mode');
    return new Promise((resolve) => setTimeout(() => resolve(newData), 1500));
  }

  console.log('Adding new request to server:', dataToSend);
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      setTimeout(() => {
        const mockCreated = { ...newData, id: 'MOCK-' + Date.now() };
        resolve(mockCreated);
      }, 1000);
      return;
    }
    google.script.run
      .withSuccessHandler((serverResult: any) => {
        console.log('Server add successful:', serverResult);
        resolve(serverResult);
      })
      .withFailureHandler(reject)
      .addRequestToServer(dataToSend);
  });
};

/**
 * Deletes a request from the server.
 */
export const deleteRequest = (request: HydratedRequest): Promise<HydratedRequest> => {
  if (!request.id) throw new Error('Cannot delete request without ID');

  if (IS_MOCK) {
    console.warn('google.script.run.deleteRequest called in mock mode');
    return new Promise((resolve) => setTimeout(() => resolve(request), 1500));
  }

  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((serverResult: any) => {
        console.log('Server add successful:', serverResult);
        resolve(serverResult);
      })
      .withFailureHandler(reject)
      .deleteRequestFromServer(request.id);
  });
};

/**
 * Uploads a file to Google Drive.
 */
export const uploadFile = (base64Data: string, fileName: string, mimeType: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      console.log('Mock uploading file:', fileName);
      setTimeout(() => resolve('https://drive.google.com/mock-file-url'), 1500);
      return;
    }
    google.script.run
      .withSuccessHandler((url: string) => resolve(url))
      .withFailureHandler(reject)
      .uploadFile(base64Data, fileName, mimeType);
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
        { email: 'user@walpole.k12.ma.us', name: 'Standard User', role: 'User', schools: ['Walpole High'] },
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
export function hydrate(request: RawRequest): HydratedRequest {
  if (request.reqType === 'Translation') {
    return {
      ...(request as any),
      requestDate: request.requestDate ? new Date(request.requestDate) : null,
      submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
      approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
      contractorScheduledDate: request.contractorScheduledDate ? new Date(request.contractorScheduledDate) : null,
      documentReturnedDate: request.documentReturnedDate ? new Date(request.documentReturnedDate) : null,
    } as TranslationRequest;
  } else {
    return {
      ...(request as any),
      requestDate: request.requestDate ? new Date(request.requestDate) : null,
      submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
      approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
      contractorScheduledDate: request.contractorScheduledDate ? new Date(request.contractorScheduledDate) : null,
      guestConfirmedDate: request.guestConfirmedDate ? new Date(request.guestConfirmedDate) : null,
      techConfirmedDate: request.techConfirmedDate ? new Date(request.techConfirmedDate) : null,

      startTime: hydrateTime(request.startTime),
      endTime: hydrateTime(request.endTime),
    } as InterpretationRequest;
  }
}

function hydrateTime(time: string | null): string | null {
  if (!time) return 'Invalid time';

  const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
  if (!timeRegex.test(time)) {
    return 'Invalid time format';
  }

  try {
    let [hours, minutes, seconds] = time.split(':').map(Number);

    if (hours > 23 || minutes > 59 || seconds > 59) {
      return 'Invalid time';
    }

    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;

    return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return 'Invalid time';
  }
}
