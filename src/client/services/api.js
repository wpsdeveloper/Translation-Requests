const IS_MOCK = !window.location.href.includes('google') && !window.location.href.includes('script');

// Safety proxy for local development to prevent 'google is not defined' errors
if (IS_MOCK && typeof window.google === 'undefined') {
  window.google = {
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

export const fetchData = () => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      import('./mock-data.js').then((module) => {
        console.log('Mock data loaded dynamically');
        const data = JSON.parse(module.getMockData());
        const cleanRequests = data.requests.map(hydrate);
        setTimeout(() => resolve({ requests: cleanRequests, schools: data.schools }), 1500);
      });
      return;
    }
    google.script.run
      .withSuccessHandler((data) => {
        console.log('Data received from server:', data);
        const requests = data.requests || [];
        const schools = data.schools || [];
        const user = data.user || null;
        const cleanRequests = requests.map(hydrate);
        resolve({ requests: cleanRequests, schools: schools, user: user });
      })
      .withFailureHandler((err) => {
        console.error('Server error:', err);
        reject(err);
      })
      .getDataFromServer();
  });
};

export const saveRequest = (updatedData) => {
  // Create a copy and convert Dates to ISO strings for the server
  const dataToSend = {
    ...updatedData,
    requestDate: updatedData.requestDate instanceof Date ? updatedData.requestDate.toISOString() : updatedData.requestDate,
    submittedDate: updatedData.submittedDate instanceof Date ? updatedData.submittedDate.toISOString() : updatedData.submittedDate,
    approvedDate: updatedData.approvedDate instanceof Date ? updatedData.approvedDate.toISOString() : updatedData.approvedDate,
    startTime: updatedData.startTime instanceof Date ? updatedData.startTime.toISOString() : updatedData.startTime,
    endTime: updatedData.endTime instanceof Date ? updatedData.endTime.toISOString() : updatedData.endTime,
  };

  console.log('Saving request to server (de-hydrated):', dataToSend);

  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler((serverResult) => {
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
export const fetchAllUsers = () => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      resolve([
        { email: 'admin@walpole.k12.ma.us', name: 'Admin User', role: 'Admin', schools: [] },
        { email: 'user@walpole.k12.ma.us', name: 'Standard User', role: 'User', schools: ['Walpole High'] }
      ]);
      return;
    }
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .getUsersData();
  });
};

/**
 * Admin: Add, Edit, or Delete a user.
 */
export const saveUserData = (userData, action) => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      console.log(`Mock User ${action}:`, userData);
      setTimeout(() => resolve(userData), 1000);
      return;
    }
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .saveUser(userData, action);
  });
};


export function hydrate(request) {
  return {
    ...request,
    requestDate: request.requestDate ? new Date(request.requestDate) : null,
    submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
    approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
    startTime: request.startTime ? new Date(request.startTime) : null,
    endTime: request.endTime ? new Date(request.endTime) : null,
  };
}