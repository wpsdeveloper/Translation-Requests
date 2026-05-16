import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/DetailsPanel/DetailsPanel';
import { store } from '../client/services/state';
import { requestActions } from '../client/services/actions';
import { showModal } from '../client/services/ui';

vi.mock('../client/services/actions', () => ({
  requestActions: {
    save: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../client/services/ui', () => ({
  showToast: vi.fn(),
  showModal: vi.fn((title, body, callback) => callback()),
}));

describe('DetailsPanel', () => {
  let container: HTMLElement;
  let panel: any;

  const mockRequest: TranslationRequest = {
    id: '456',
    name: 'Jane Smith',
    school: 'Boyden Elementary',
    status: 'Needs Approval',
    reqType: 'Translation',
    requestDate: new Date('10/25/2023'),
    submittedDate: new Date('10/24/2023'),
    email: 'jane@example.com',
    originalLanguage: 'English',
    targetLanguage: 'French',
    description: 'Help with document',
    docPageCount: '2',
    docLink: 'http://docs.com',
    contractor: '',
    contractorName: '',
    approverName: '',
    approvedDate: null,
    documentReturnedDate: null,
    contractorScheduledDate: null,
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ selectedRow: null, user: { email: 'admin@test.com', name: 'Admin', role: 'Admin', schools: [] } });

    panel = document.createElement('details-panel');
    container.appendChild(panel);
    vi.clearAllMocks();
  });

  it('should open and hydrate when a row is selected', async () => {
    store.setState({ selectedRow: mockRequest });

    expect(panel.classList.contains('open')).toBe(true);
    // Use a small delay for DOM updates if needed, though usually sync in JSDOM
    expect(panel.shadowRoot.querySelector('#view-requester-name').textContent).toBe('Jane Smith');
  });

  it('should toggle edit mode correctly', () => {
    store.setState({ selectedRow: mockRequest });
    panel.mode = 'edit';

    expect(panel.mode).toBe('edit');
    const saveBtn = panel.shadowRoot.querySelector('#save-btn');
    expect(saveBtn.style.display).not.toBe('none');
  });

  it('should gather form data correctly using getSaveData', () => {
    panel.data = mockRequest;
    panel.mode = 'edit';

    const input = panel.shadowRoot.querySelector('textarea[data-bind="description"]') as HTMLInputElement;
    input.value = 'Updated Description';

    const data = panel.getSaveData();
    expect(data.description).toBe('Updated Description');
  });

  it('should call requestActions.save when save button is clicked', async () => {
    panel.data = mockRequest;
    panel.mode = 'edit';

    const saveBtn = panel.shadowRoot.querySelector('#save-btn') as HTMLButtonElement;
    await saveBtn.click();

    expect(requestActions.save).toHaveBeenCalled();
    expect(panel.mode).toBe('view');
  });

  it('should call requestActions.delete when delete button is clicked and confirmed', async () => {
    panel.data = mockRequest;
    panel.mode = 'edit';

    const deleteBtn = panel.shadowRoot.querySelector('#delete-btn') as HTMLButtonElement;
    await deleteBtn.click();

    expect(showModal).toHaveBeenCalled();
    expect(requestActions.delete).toHaveBeenCalledWith(mockRequest);
  });

  it('should call requestActions.approve when approve button is clicked and confirmed', async () => {
    panel.data = mockRequest;
    panel.mode = 'view';

    const approveBtn = panel.shadowRoot.querySelector('#approve-btn') as HTMLButtonElement;
    await approveBtn.click();

    expect(requestActions.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'Approved' }));
  });

  it('should call requestActions.deny when deny button is clicked and confirmed', async () => {
    panel.data = mockRequest;
    panel.mode = 'view';

    const denyBtn = panel.shadowRoot.querySelector('#deny-btn') as HTMLButtonElement;
    await denyBtn.click();

    expect(requestActions.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'Denied' }));
  });

  it('should format dates correctly in autoHydrate', () => {
    panel.data = mockRequest;
    const dateEl = panel.shadowRoot.querySelector('[data-bind="requestDate"][data-format="date"]');
    expect(dateEl.textContent).toBe('Oct 25, 2023');
  });

  it('should close and clear selection when close button is clicked', () => {
    store.setState({ selectedRow: mockRequest });

    const closeBtn = panel.shadowRoot.querySelector('#close-btn');
    closeBtn.click();

    expect(store.getState().selectedRow).toBe(null);
    expect(panel.classList.contains('open')).toBe(false);
  });
});
