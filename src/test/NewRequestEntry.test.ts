import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/NewRequestEntry/NewRequestEntry';
import { store } from '../client/services/state';

describe('NewRequestEntry', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ schools: ['School A'] });
  });

  it('should render the entry form', () => {
    const entry = document.createElement('new-request-entry');
    container.appendChild(entry);

    expect(entry.shadowRoot).not.toBeNull();
    expect(entry.shadowRoot!.querySelector('form')).not.toBeNull();
  });

  it('should show translation fields when Translation is selected', () => {
    const entry = document.createElement('new-request-entry') as any;
    container.appendChild(entry);

    const typeInput = entry.shadowRoot.querySelector('input[name="req-type"][value="Translation"]') as HTMLInputElement;
    typeInput.checked = true;
    typeInput.dispatchEvent(new Event('change'));

    const translationFields = entry.shadowRoot.querySelector('.translation-only');
    expect(translationFields.style.display).not.toBe('none');
  });
});
