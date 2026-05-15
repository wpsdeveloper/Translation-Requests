import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/RequestsDashboard/RequestsDashboard';

describe('RequestsDashboard', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render the dashboard template', () => {
    const dashboard = document.createElement('requests-dashboard');
    container.appendChild(dashboard);

    expect(dashboard.shadowRoot).not.toBeNull();
  });
});
