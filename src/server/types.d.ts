type UserRole = 'Admin' | 'User';

interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  schools: string[];
}

/**
 * Server-side version of the request, matching the AppSheet API.
 */
interface RawRequest {
  id: string;
  email: string;
  name: string;
  school: string;
  status: string;
  reqType: string;
  originalLanguage: string;
  targetLanguage: string;
  interpretationType: string;
  docPageCount: string;
  description: string;
  docLink: string;
  eventLocation: string;
  contractor: string;
  contractorName: string;
  approverName: string;
  requestDate: string;
  approvedDate: string;
  submittedDate: string;
  endTime: string;
  startTime: string;
}
