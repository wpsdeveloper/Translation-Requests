import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/StatusMultiSelect/StatusMultiSelect';
import { store } from '../client/services/state';

describe('StatusMultiSelect', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ filterStatuses: [] });
  });

  it('should render status options as checkboxes', () => {
    const multi = document.createElement('status-multi-select');
    container.appendChild(multi);

    const checkboxes = multi.shadowRoot?.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes?.length).toBeGreaterThan(4);
  });

  it('should update store when a status is toggled', () => {
    const multi = document.createElement('status-multi-select') as any;
    container.appendChild(multi);

    const approvedCheckbox = multi.shadowRoot?.querySelector('#status-approved') as HTMLInputElement;
    approvedCheckbox.checked = true;
    // We dispatch 'change' because that's what the component listens for
    approvedCheckbox.dispatchEvent(new Event('change', { bubbles: true }));

    expect(store.getState().filterStatuses).toContain('Approved');
  });

  it('should reflect initial state from store', () => {
    store.setState({ filterStatuses: ['Denied', 'Complete'] });
    
    const multi = document.createElement('status-multi-select');
    container.appendChild(multi);

    const checkedBoxes = multi.shadowRoot?.querySelectorAll('input:checked');
    expect(checkedBoxes?.length).toBe(2);
    
    const selectedText = multi.shadowRoot?.querySelector('#selected-text');
    expect(selectedText?.textContent).toBe('2 Statuses');
  });
});
