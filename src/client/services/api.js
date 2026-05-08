// src/client/services/api.js
const FORCE_SERVER = false;
const IS_MOCK = !FORCE_SERVER && !window.location.href.includes('google') && !window.location.href.includes('script');

export const fetchData = () => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK && !FORCE_SERVER) {
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
        const cleanRequests = data.requests.map(hydrate);
        resolve({ requests: cleanRequests, schools: data.schools });
      })
      .withFailureHandler(reject)
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
  return {
    ...request,
    requestDate: request.requestDate ? new Date(request.requestDate) : null,
    submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
    approvedDate: request.approvedDate ? new Date(request.approvedDate) : null,
    startTime: request.startTime ? new Date(request.startTime) : null,
    endTime: request.endTime ? new Date(request.endTime) : null,
  };
}