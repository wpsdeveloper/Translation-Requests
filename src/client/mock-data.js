export function getMockData() {
  return JSON.stringify(mockData.requests);
};

const mockData = {
  requests: [{
    id: '12345',
    status: 'Pending',
    requestDate: new Date(),
    submittedDate: new Date(),  
    name: 'John Doe',
    reqType: 'Translation',
    eventLocation: '123 Main St, Anytown, USA',
    description: 'Requesting translation of syllabus.',
    docLink: 'https://example.com/document',
    docPageCount: 10,
    school: 'Washington High School',
    originalLanguage: 'English',
    targetLanguage: 'Spanish',
  },
  {
    id: '67890',
    status: 'Completed',
    requestDate: new Date(),
    submittedDate: new Date(),
    name: 'Jane Smith',
    reqType: 'Interpretation',
    eventLocation: '456 Oak Ave, Somewhere, USA',
    description: 'Requesting interpretation services for an upcoming event.',
    startTime: new Date('5/25/2026 6:00 PM'),
    endTime: new Date('5/25/2026 7:00 PM'),
    school: 'Lincoln High School',
    originalLanguage: 'English',
    targetLanguage: 'Chinese',
  }]
};