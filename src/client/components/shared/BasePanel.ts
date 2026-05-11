/**
 * BasePanel: A base class for custom elements that function as sliding side panels.
 * Handles the 'open' state, slide-in animations, and close button events.
 */
export abstract class BasePanel extends HTMLElement {
  protected _isOpen = false;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  /**
   * Gets whether the panel is currently open.
   */
  get open(): boolean {
    return this._isOpen;
  }

  /**
   * Sets the open state of the panel and toggles the 'open' CSS class.
   */
  set open(value: boolean) {
    if (this._isOpen === value) return; // Prevent redundant triggers and recursion
    this._isOpen = value;
    this.classList.toggle('open', value);
    
    if (value) {
      this.onOpen();
    } else {
      this.onClose();
    }
  }

  /**
   * Utility to automatically attach a listener to a close button if it exists in the shadow DOM.
   */
  protected setupBaseListeners(root: ShadowRoot) {
    root.getElementById('close-btn')?.addEventListener('click', () => (this.open = false));
    root.getElementById('close-modal')?.addEventListener('click', () => (this.open = false));
  }

  /**
   * Lifecycle hooks for subclasses
   */
  protected onOpen() {}
  protected onClose() {}

  /**
   * Closes the panel.
   */
  public close() {
    this.open = false;
  }
}
