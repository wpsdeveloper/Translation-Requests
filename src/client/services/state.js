class GlobalStore {
  constructor() {
    this._state = {
      selectedRow: null,
      allRows: [],
      schools: [],
      filterSchool: null,
      isPanelOpen: false
    };
    this._listeners = [];
  }

  // Allow components to subscribe to changes
  subscribe(callback) {
    this._listeners.push(callback);
  }

  // Update state and notify everyone
  setState(newState) {
    this._state = { ...this._state, ...newState };
    this._listeners.forEach(callback => callback(this._state));
  }

  getState() {
    return this._state;
  }
}

export const store = new GlobalStore();