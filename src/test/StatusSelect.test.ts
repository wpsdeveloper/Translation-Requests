import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/StatusSelect/StatusSelect';

describe('StatusSelect', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render the current status in a badge in view mode', () => {
    container.innerHTML = '<status-select status="Approved" mode="view"></status-select>';
    const select = container.querySelector('status-select') as any;

    const badge = select.shadowRoot.querySelector('#status-badge');
    expect(badge.getAttribute('status')).toBe('Approved');
  });

  it('should dispatch a "change" event when the dropdown is updated in edit mode', () => {
    container.innerHTML = '<status-select status="Approved" mode="edit"></status-select>';
    const select = container.querySelector('status-select') as any;

    const changeSpy = vi.fn();
    select.addEventListener('change', changeSpy);

    const dropdown = select.shadowRoot.querySelector('#status-dropdown');
    dropdown.value = 'Complete';
    dropdown.dispatchEvent(new Event('change'));

    expect(changeSpy).toHaveBeenCalled();
    expect(changeSpy.mock.calls[0][0].detail.status).toBe('Complete');
  });

  it('should show the dropdown only in edit mode', () => {
    container.innerHTML = '<status-select status="Approved" mode="view"></status-select>';
    const select = container.querySelector('status-select') as any;

    const editModeDiv = select.shadowRoot.querySelector('#edit-mode');
    expect(editModeDiv.style.display).toBe('none');

    select.setAttribute('mode', 'edit');
    expect(editModeDiv.style.display).toBe('block');
  });
});
