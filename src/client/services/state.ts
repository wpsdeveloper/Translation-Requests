import { AppUser, TranslationRequest } from '../../shared/types';

interface State {
  selectedRow: TranslationRequest | null;
  allRows: TranslationRequest[];
  schools: string[];
  filterSchool: string | null;
  filterStatuses: string[];
  isPanelOpen: boolean;
  user: AppUser | null;
  activeView: 'dashboard' | 'users';
  allUsers: AppUser[];
}

class GlobalStore {
  private _state: State;
  private _listeners: ((state: State) => void)[];

  constructor() {
    this._state = {
      selectedRow: null,
      allRows: [],
      schools: [],
      filterSchool: null,
      filterStatuses: [],
      isPanelOpen: false,
      user: null,
      activeView: 'dashboard',
      allUsers: []
    };
    this._listeners = [];
  }

  subscribe(callback: (state: State) => void) {
    this._listeners.push(callback);
  }

  setState(newState: Partial<State>) {
    this._state = { ...this._state, ...newState };
    this._listeners.forEach(callback => callback(this._state));
  }

  getState(): State {
    return this._state;
  }
}

export const store = new GlobalStore();
