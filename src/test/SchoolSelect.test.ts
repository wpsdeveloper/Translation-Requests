import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/SchoolSelect/SchoolSelect';
import { store } from '../client/services/state';

describe('SchoolSelect', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ schools: ['School A', 'School B', 'School C'] });
  });

  it('should render the list of schools from the store', () => {
    const select = document.createElement('school-select') as any;
    select.mode = 'edit';
    container.appendChild(select);

    const dropdown = select.shadowRoot.querySelector('#school-dropdown');
    const options = dropdown.querySelectorAll('option');

    // Default empty option + 3 schools + 'Other'
    expect(options.length).toBe(5);
    expect(options[1].textContent).toBe('School A');
  });

  it('should display the current value as text in view mode', () => {
    const select = document.createElement('school-select') as any;
    select.value = 'School C';
    select.mode = 'view';
    container.appendChild(select);

    const viewEl = select.shadowRoot.querySelector('#view-value');
    expect(viewEl.textContent).toBe('School C');
  });
});
