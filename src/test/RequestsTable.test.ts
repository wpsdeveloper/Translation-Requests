import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/RequestsTable/RequestsTable';
import { store } from '../client/services/state';

describe('RequestsTable', () => {
  let container: HTMLElement;
  const mockRequests: TranslationRequest[] = [
    {
      id: '1',
      name: 'Req 1',
      school: 'School A',
      status: 'Approved',
      requestDate: new Date(),
      submittedDate: new Date(),
      approvedDate: null,
      email: '',
      reqType: 'Translation',
      originalLanguage: '',
      targetLanguage: '',
      docPageCount: '',
      description: '',
      docLink: '',
      contractor: '',
      contractorName: '',
      approverName: '',
      documentReturnedDate: new Date(),
      contractorScheduledDate: new Date(),
    },
    {
      id: '2',
      name: 'Req 2',
      school: 'School B',
      status: 'Denied',
      requestDate: new Date(),
      submittedDate: new Date(),
      approvedDate: null,
      email: '',
      reqType: 'Translation',
      originalLanguage: '',
      targetLanguage: '',
      docPageCount: '',
      description: '',
      docLink: '',
      contractor: '',
      contractorName: '',
      approverName: '',
      documentReturnedDate: new Date(),
      contractorScheduledDate: new Date(),
    },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ allRows: [], filterSchool: null, filterStatuses: [], schools: ['School A', 'School B'], loading: false });
  });

  it('should render rows when data is loaded', async () => {
    const table = document.createElement('requests-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests });

    // Wait for the store subscription to trigger updateRows
    const rows = table.shadowRoot?.querySelectorAll('requests-row');
    expect(rows?.length).toBe(2);
  });

  it('should filter rows by school', () => {
    const table = document.createElement('requests-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterSchool: 'School A' });

    const rows = table.shadowRoot?.querySelectorAll('requests-row');
    expect(rows?.length).toBe(1);
    expect((rows?.[0] as any).data.school).toBe('School A');
  });

  it('should filter rows by status', () => {
    const table = document.createElement('requests-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterStatuses: ['Denied'] });

    const rows = table.shadowRoot?.querySelectorAll('requests-row');
    expect(rows?.length).toBe(1);
    expect((rows?.[0] as any).data.status).toBe('Denied');
  });

  it('should show message when no rows match filter', () => {
    const table = document.createElement('requests-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterSchool: 'Non-Existent' });

    const message = table.shadowRoot?.querySelector('.table-message');
    expect(message?.textContent).toContain('No records found');
  });

  it('should show loading spinner when loading is true', () => {
    const table = document.createElement('requests-table');
    container.appendChild(table);

    store.setState({ loading: true });

    const spinner = table.shadowRoot?.querySelector('.spinner');
    expect(spinner).not.toBeNull();
  });
});

