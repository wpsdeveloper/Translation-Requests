import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/DetailsTranslation/DetailsTranslation';

describe('DetailsTranslation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should display page count in view mode', () => {
    const el = document.createElement('details-translation') as any;
    // Set data then append to trigger connectedCallback/render
    el.data = { docPageCount: '15', contractor: '', contractorName: '' };
    el.mode = 'view';
    container.appendChild(el);
    
    const root = el.shadowRoot;
    const viewSpan = root.querySelector('#view-document-length');
    expect(viewSpan).toBeTruthy();
    expect(viewSpan.textContent).toBe('15');
  });

  it('should show input in edit mode', () => {
    const el = document.createElement('details-translation') as any;
    el.data = { docPageCount: '15' };
    el.mode = 'edit';
    container.appendChild(el);
    
    const root = el.shadowRoot;
    const input = root.querySelector('#edit-document-length');
    expect(input).toBeTruthy();
    expect(input.value).toBe('15');
  });
});
