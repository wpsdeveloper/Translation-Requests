import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/StatusBadge/StatusBadge';

describe('StatusBadge', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render the status text correctly', () => {
    container.innerHTML = '<status-badge status="Approved"></status-badge>';
    const badge = container.querySelector('status-badge');
    
    expect(badge).toBeTruthy();
    const shadowRoot = badge?.shadowRoot;
    const badgeSpan = shadowRoot?.querySelector('.status-indicator');
    
    expect(badgeSpan?.textContent).toBe('Approved');
  });

  it('should have the correct status attribute for CSS targeting', () => {
    container.innerHTML = '<status-badge status="Denied"></status-badge>';
    const badge = container.querySelector('status-badge');
    
    expect(badge?.getAttribute('status')).toBe('Denied');
  });

  it('should reflect attribute changes in the internal text', async () => {
    container.innerHTML = '<status-badge status="Needs Approval"></status-badge>';
    const badge = container.querySelector('status-badge') as any;
    
    badge.setAttribute('status', 'Complete');
    
    const badgeSpan = badge.shadowRoot.querySelector('.status-indicator');
    expect(badgeSpan.textContent).toBe('Complete');
    expect(badge.getAttribute('status')).toBe('Complete');
  });
});
