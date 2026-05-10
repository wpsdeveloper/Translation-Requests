import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/DetailsPanel/DetailsPanel';
import { store } from '../client/services/state';
import { TranslationRequest } from '../shared/types';

describe('DetailsPanel', () => {
  let container: HTMLElement;
  const mockRequest: TranslationRequest = {
    id: '456',
    name: 'Jane Smith',
    school: 'Boyden Elementary',
    status: 'Needs Approval',
    reqType: 'Translation',
    requestDate: new Date(),
    submittedDate: new Date(),
    email: 'jane@example.com',
    originalLanguage: 'English',
    targetLanguage: 'French',
    description: 'Help with document',
    interpretationType: '',
    docPageCount: '2',
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
    store.setState({ selectedRow: null, user: { email: 'admin@test.com', name: 'Admin', role: 'Admin', schools: [] } });
  });

  it('should open and hydrate when a row is selected', async () => {
    const panel = document.createElement('details-panel') as any;
    container.appendChild(panel);

    store.setState({ selectedRow: mockRequest });

    expect(panel.classList.contains('open')).toBe(true);
    expect(panel.shadowRoot.querySelector('#view-requester-name').textContent).toBe('Jane Smith');
  });

  it('should toggle edit mode correctly', () => {
    const panel = document.createElement('details-panel') as any;
    container.appendChild(panel);
    store.setState({ selectedRow: mockRequest });

    // The edit button contains an SVG, so we click the button itself
    const editBtn = panel.shadowRoot.querySelector('#edit-btn');
    editBtn.click();

    expect(panel.mode).toBe('edit');

    const saveBtn = panel.shadowRoot.querySelector('#save-btn');
    expect(saveBtn.style.display).not.toBe('none');
  });

  it('should close when close button is clicked', () => {
    const panel = document.createElement('details-panel') as any;
    container.appendChild(panel);
    store.setState({ selectedRow: mockRequest });

    const closeBtn = panel.shadowRoot.querySelector('#close-btn');
    closeBtn.click();

    expect(store.getState().selectedRow).toBe(null);
    expect(panel.classList.contains('open')).toBe(false);
  });
});
