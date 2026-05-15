import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SlidingPanel } from '../client/components/DetailsPanel/SlidingPanel';

// Define a concrete subclass for testing the abstract SlidingPanel
class TestPanel extends SlidingPanel {
  constructor() {
    super();
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `
        <button id="close-btn"></button>
        <div id="content"></div>
      `;
      this.setupBaseListeners(this.shadowRoot);
    }
  }
}
customElements.define('test-panel', TestPanel);

describe('SlidingPanel', () => {
  let container: HTMLElement;
  let panel: TestPanel;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    panel = document.createElement('test-panel') as TestPanel;
    container.appendChild(panel);
  });

  it('should toggle open state correctly', () => {
    panel.open = true;
    expect(panel.open).toBe(true);
    expect(panel.classList.contains('open')).toBe(true);

    panel.open = false;
    expect(panel.open).toBe(false);
    expect(panel.classList.contains('open')).toBe(false);
  });

  it('should close when close button is clicked', () => {
    panel.open = true;
    const closeBtn = panel.shadowRoot?.getElementById('close-btn');
    closeBtn?.click();

    expect(panel.open).toBe(false);
  });

  it('should call lifecycle hooks', () => {
    const onOpenSpy = vi.spyOn(panel as any, 'onOpen');
    const onCloseSpy = vi.spyOn(panel as any, 'onClose');

    panel.open = true;
    expect(onOpenSpy).toHaveBeenCalled();

    panel.open = false;
    expect(onCloseSpy).toHaveBeenCalled();
  });
});
