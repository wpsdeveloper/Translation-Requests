type UserRole = 'Admin' | 'User' | 'Approver' | 'Guest';

interface AppUser {
  email: string;
  name: string;
  role: UserRole;
  schools: string[];
}

/**
 * The raw data structure as it comes from/goes to the AppSheet API.
 * All dates and times are handled as strings.
 */
interface RawRequest {
  id: string;

  email: string;
  name: string;
  school: string;
  submittedDate: string;

  status: string;
  reqType: string;
  requestDate: string;
  
  originalLanguage: string;
  targetLanguage: string;
  description: string;
  
  docPageCount: string;
  docLink: string;
  
  interpretationType: string;
  eventLocation: string;
  endTime: string;
  startTime: string;
  
  approverName: string;
  approvedDate: string;

  contractor: string;
  contractorName: string;

  contractorScheduledDate: string;
  documentReturnedDate: string;
  guestConfirmedDate: string;
  techConfirmedDate: string;
}

/**
 * The hydrated request object used throughout the frontend.
 * String dates are converted to real Date objects for easier manipulation.
 */
interface TranslationRequest extends Omit<
  RawRequest,
  'requestDate' | 'approvedDate' | 'submittedDate' | 'startTime' | 'endTime'
> {
  submittedDate: Date | null;
  requestDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  approvedDate: Date | null;
  contractorScheduledDate: Date | null;
  documentReturnedDate: Date | null;
  guestConfirmedDate: Date | null;
  techConfirmedDate: Date | null;
}

interface AppState {
  requests: TranslationRequest[];
  schools: string[];
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

type AppSheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';
