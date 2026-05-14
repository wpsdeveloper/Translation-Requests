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
interface RawBaseRequest {
  id: string;

  email: string;
  name: string;
  school: string;
  submittedDate: string;

  status: string;
  requestDate: string;

  originalLanguage: string;
  targetLanguage: string;
  description: string;


  approverName: string;
  approvedDate: string;

  contractor: string;
  contractorName: string;

  contractorScheduledDate: string;

  documentReturnedDate: string;
  guestConfirmedDate: string;
  techConfirmedDate: string;
}

interface RawTranslationRequest extends RawBaseRequest {
  reqType: "Translation";
  docPageCount: string;
  docLink: string;
}

interface RawInterpretationRequest extends RawBaseRequest {
  reqType: "Interpretation";
  interpretationType: string;
  eventLocation: string;
  endTime: string;
  startTime: string;
}

type RawRequest = RawTranslationRequest | RawInterpretationRequest;

/**
 * The hydrated request object used throughout the frontend.
 * String dates are converted to real Date objects for easier manipulation.
 */
interface BaseRequest extends Omit<
  RawBaseRequest,
  | 'submittedDate'
  | 'requestDate'
  | 'approvedDate'
  | 'contractorScheduledDate'
  | 'documentReturnedDate'
  | 'guestConfirmedDate'
  | 'techConfirmedDate'
> {
  submittedDate: Date | null;
  requestDate: Date | null;
  approvedDate: Date | null;
  contractorScheduledDate: Date | null;
  documentReturnedDate: Date | null;
  guestConfirmedDate: Date | null;
  techConfirmedDate: Date | null;
}

interface TranslationRequest extends BaseRequest {
  reqType: "Translation";
  docPageCount: string;
  docLink: string;
}

interface InterpretationRequest extends BaseRequest {
  reqType: "Interpretation";
  interpretationType: string;
  eventLocation: string;
  startTime: Date | null;
  endTime: Date | null;
}

type HydratedRequest = TranslationRequest | InterpretationRequest;

interface AppState {
  requests: HydratedRequest[];
  schools: string[];
  user: AppUser | null;
  loading: boolean;
  error: string | null;
}

type AppSheetAction = 'Find' | 'Add' | 'Edit' | 'Delete';
