type UserRole = 'Admin' | 'User' | 'Approver' | 'Guest';

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

/**
 * The hydrated request object used throughout the frontend.
 * String dates are converted to real Date objects for easier manipulation.
 */
export interface TranslationRequest extends Omit<
  RawRequest,
  'requestDate' | 'approvedDate' | 'submittedDate' | 'startTime' | 'endTime'
> {
  requestDate: Date | null;
  approvedDate: Date | null;
  submittedDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
}

export interface AppState {
  requests: TranslationRequest[];
  schools: string[];
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

export type AppSheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';
