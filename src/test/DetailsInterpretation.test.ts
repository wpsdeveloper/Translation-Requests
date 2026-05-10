import { describe, it, expect, beforeEach } from 'vitest';
import '../client/components/DetailsInterpretation/DetailsInterpretation';

describe('DetailsInterpretation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should display location and times in view mode', () => {
    const el = document.createElement('details-interpretation') as any;
    el.data = {
      eventLocation: 'Main Hall',
      startTime: new Date('2023-10-25T09:00:00'),
      endTime: new Date('2023-10-25T11:00:00')
    };
    el.mode = 'view';
    container.appendChild(el);
    
    const root = el.shadowRoot;
    expect(root.querySelector('#view-event-location').textContent).toBe('Main Hall');
    expect(root.querySelector('#view-event-time').textContent).toContain('9:00');
  });

  it('should show scheduling inputs in process mode', () => {
    const el = document.createElement('details-interpretation') as any;
    // Set data first to ensure render() is called
    el.data = { id: 'test' };
    el.mode = 'process';
    container.appendChild(el);
    
    const root = el.shadowRoot;
    const editScheduled = root.querySelector('#edit-date-scheduled');
    expect(editScheduled).toBeTruthy();
    expect((editScheduled as HTMLElement).style.display).not.toBe('none');
  });
});
