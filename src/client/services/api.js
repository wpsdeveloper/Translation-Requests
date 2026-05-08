const IS_MOCK = !window.location.href.includes('google') && !window.location.href.includes('script');

// Safety proxy for local development to prevent 'google is not defined' errors
if (IS_MOCK && typeof window.google === 'undefined') {
  window.google = {
    script: {
      run: {
        withSuccessHandler: function() { return this; },
        withFailureHandler: function() { return this; },
        getDataFromServer: function() { console.warn('google.script.run.getRequestsFromAppSheet called in mock mode'); },
        saveDataToServer: function() { console.warn('google.script.run.saveDataToServer called in mock mode'); }
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
        setTimeout(() => resolve({ requests: cleanRequests, schools: data.schools }), 500);
      });
      return;
    }
    google.script.run
      .withSuccessHandler((data) => {
        console.log('Data received from server:', data);
        const requests = data.requests || [];
        console.log('Requests from server:', requests);
        const schools = data.schools || [];
        const cleanRequests = requests.map(hydrate);
        console.log('Clean requests from server:', cleanRequests);
        resolve({ requests: cleanRequests, schools: schools });
      })
      .withFailureHandler((err) => {
        console.error('Server error:', err);
        reject(err);
      })
      .getDataFromServer();
  });
};

export const saveRequest = (updatedData) => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      console.log('Simulating save to server:', updatedData);
      // Simulate network delay
      setTimeout(() => resolve(updatedData), 800);
      return;
    }
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      .saveDataToServer(updatedData);
  });
};

function hydrate(request) {
  console.log('Hydrating request:', request);
  return {
    ...request,
    requestDate: request.requestDate ? new Date(request.requestDate) : null,
    submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
    approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
    startTime: request.startTime ? new Date(request.startTime) : null,
    endTime: request.endTime ? new Date(request.endTime) : null,
  };
}