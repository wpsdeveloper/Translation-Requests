// src/client/services/api.js

const IS_MOCK = window.location.href.includes('localhost'); // Toggle this for local dev vs. production

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
        const cleanRequests = data.requests.map(hydrate);
        resolve({ requests: cleanRequests, schools: data.schools });
      })
      .withFailureHandler(reject)
      .getDataFromServer();
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