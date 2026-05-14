import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/RequestsRow/RequestsRow';
import { store } from '../client/services/state';
import { BaseRequest } from '../shared/types';

describe('AppRow', () => {
  let container: HTMLElement;
  const mockRequest: BaseRequest = {
    id: '123',
    name: 'John Doe',
    school: 'Walpole High',
    status: 'Approved',
    reqType: 'Translation',
    requestDate: new Date('2023-10-25T12:00:00'),
    submittedDate: new Date('2023-10-20T12:00:00'),
    email: 'john@example.com',
    originalLanguage: 'English',
    targetLanguage: 'Spanish',
    description: 'Test description',
    interpretationType: '',
    docPageCount: '5',
    docLink: '',
    eventLocation: '',
    contractor: '',
    contractorName: '',
    approverName: '',
    startTime: null,
    endTime: null,
    approvedDate: null,
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Reset store state
    store.setState({ selectedRow: null, allRows: [] });
  });

  it('should render request data correctly', () => {
    const row = document.createElement('app-row') as any;
    row.data = mockRequest;
    container.appendChild(row);

    const shadowRoot = row.shadowRoot;
    expect(shadowRoot.querySelector('.requester-name').textContent).toBe('John Doe');
    expect(shadowRoot.querySelector('.requester-school').textContent).toBe('Walpole High');
    expect(shadowRoot.querySelector('status-badge').getAttribute('status')).toBe('Approved');
  });

  it('should highlight background when selected in store', () => {
    const row = document.createElement('app-row') as any;
    row.data = mockRequest;
    container.appendChild(row);

    store.setState({ selectedRow: mockRequest });

    // Check if at least one cell has the background color
    const cells = row.shadowRoot.querySelectorAll('.td');
    const hasHighlight = Array.from(cells).some((td: any) => td.style.backgroundColor === 'rgb(232, 240, 254)'); // #e8f0fe
    expect(hasHighlight).toBe(true);
  });

  it('should update store when clicked', () => {
    const row = document.createElement('app-row') as any;
    row.data = mockRequest;
    container.appendChild(row);

    row.click();

    const state = store.getState();
    expect(state.selectedRow?.id).toBe('123');
    expect(state.isPanelOpen).toBe(true);
  });
});
