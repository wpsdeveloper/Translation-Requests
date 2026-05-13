import { AppUser, TranslationRequest } from '../../shared/types';

interface State {
  selectedRow: TranslationRequest | null;
  allRows: TranslationRequest[];
  schools: string[];
  filterSchool: string | null;
  filterStatuses: string[];
  isPanelOpen: boolean;
  user: AppUser | null;
  activeView: 'dashboard' | 'users' | 'new-request-entry';
  allUsers: AppUser[];
  loading: boolean;
}

/**
 * GlobalStore: A simple implementation of the Observable pattern.
 * This acts as the single source of truth for the entire application.
 * All components subscribe to this store to receive updates when state changes.
 */
class GlobalStore {
  private _state: State;
  private _listeners: ((state: State) => void)[];

  constructor() {
    // Initial state: defines the default structure of the app data.
    this._state = {
      selectedRow: null,
      allRows: [],
      schools: [],
      filterSchool: null,
      filterStatuses: [],
      isPanelOpen: false,
      user: null,
      activeView: 'dashboard',
      allUsers: [],
      loading: false,
    };
    this._listeners = [];
  }

  /**
   * Registers a callback that will be executed whenever the state is updated.
   */
  subscribe(callback: (state: State) => void) {
    this._listeners.push(callback);
  }

  /**
   * Updates a subset of the state and notifies all subscribers.
   * This uses an immutable-style update pattern to ensure listeners
   * always get a fresh snapshot.
   */
  setState(newState: Partial<State>) {
    this._state = { ...this._state, ...newState };
    this._listeners.forEach((callback) => callback(this._state));
  }

  getState(): State {
    return this._state;
  }
}

// Export a singleton instance of the store.
export const store = new GlobalStore();
