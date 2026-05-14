import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/RequestsTable/RequestsTable';
import { store } from '../client/services/state';
import { BaseRequest } from '../shared/types';

describe('AppTable', () => {
  let container: HTMLElement;
  const mockRequests: BaseRequest[] = [
    {
      id: '1',
      name: 'Req 1',
      school: 'School A',
      status: 'Approved',
      requestDate: new Date(),
      submittedDate: new Date(),
      approvedDate: null,
      startTime: null,
      endTime: null,
      email: '',
      reqType: 'Translation',
      originalLanguage: '',
      targetLanguage: '',
      interpretationType: '',
      docPageCount: '',
      description: '',
      docLink: '',
      eventLocation: '',
      contractor: '',
      contractorName: '',
      approverName: '',
    },
    {
      id: '2',
      name: 'Req 2',
      school: 'School B',
      status: 'Denied',
      requestDate: new Date(),
      submittedDate: new Date(),
      approvedDate: null,
      startTime: null,
      endTime: null,
      email: '',
      reqType: 'Translation',
      originalLanguage: '',
      targetLanguage: '',
      interpretationType: '',
      docPageCount: '',
      description: '',
      docLink: '',
      eventLocation: '',
      contractor: '',
      contractorName: '',
      approverName: '',
    },
  ];

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    store.setState({ allRows: [], filterSchool: null, filterStatuses: [], schools: ['School A', 'School B'] });
  });

  it('should render rows when data is loaded', async () => {
    const table = document.createElement('app-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests });

    // Wait for the store subscription to trigger updateRows
    const rows = table.shadowRoot?.querySelectorAll('app-row');
    expect(rows?.length).toBe(2);
  });

  it('should filter rows by school', () => {
    const table = document.createElement('app-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterSchool: 'School A' });

    const rows = table.shadowRoot?.querySelectorAll('app-row');
    expect(rows?.length).toBe(1);
    expect((rows?.[0] as any).data.school).toBe('School A');
  });

  it('should filter rows by status', () => {
    const table = document.createElement('app-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterStatuses: ['Denied'] });

    const rows = table.shadowRoot?.querySelectorAll('app-row');
    expect(rows?.length).toBe(1);
    expect((rows?.[0] as any).data.status).toBe('Denied');
  });

  it('should show message when no rows match filter', () => {
    const table = document.createElement('app-table');
    container.appendChild(table);

    store.setState({ allRows: mockRequests, filterSchool: 'Non-Existent' });

    const message = table.shadowRoot?.querySelector('.table-message');
    expect(message?.textContent).toContain('No records found');
  });
});
