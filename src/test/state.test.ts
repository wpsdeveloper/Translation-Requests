import { describe, it, expect, vi } from 'vitest';
import { store } from '../client/services/state';

describe('state.ts', () => {
  it('should have initial state', () => {
    const state = store.getState();
    expect(state).toHaveProperty('allRows', []);
    expect(state).toHaveProperty('selectedRow', null);
    expect(state).toHaveProperty('filterStatuses', []);
  });

  it('should update state using setState', () => {
    store.setState({ filterSchool: 'Test School' });
    expect(store.getState().filterSchool).toBe('Test School');
  });

  it('should notify listeners when state changes', () => {
    const callback = vi.fn();
    store.subscribe(callback);
    
    const newState = { isPanelOpen: true };
    store.setState(newState);
    
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith(expect.objectContaining(newState));
  });

  it('should merge new state with old state', () => {
    store.setState({ filterSchool: 'School A' });
    store.setState({ isPanelOpen: false });
    
    const state = store.getState();
    expect(state.filterSchool).toBe('School A');
    expect(state.isPanelOpen).toBe(false);
  });
});
