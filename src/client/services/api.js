// src/client/services/api.js

const IS_MOCK = window.location.href.includes('localhost'); // Toggle this for local dev vs. production

export const fetchData = () => {
  return new Promise((resolve, reject) => {
    if (IS_MOCK) {
      import('./mock-data.js').then((module) => {
        console.log('Mock data loaded dynamically');
        const cleanData = JSON.parse(module.getMockData()).map(hydrate);
        setTimeout(() => resolve(cleanData), 500);
      });
      return;
    }
    google.script.run.withSuccessHandler(resolve).withFailureHandler(reject).getDataFromServer();
  });
};

function hydrate(request) {
  return {
    ...request,
    requestDate: request.requestDate ? new Date(request.requestDate) : null,
    submittedDate: request.submittedDate ? new Date(request.submittedDate) : null,
    startTime: request.startTime ? new Date(request.startTime) : null,
    endTime: request.endTime ? new Date(request.endTime) : null,
  };
}