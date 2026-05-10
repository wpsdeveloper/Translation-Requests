// @ts-ignore
import badgeStyles from './StatusBadge.css?inline';
// @ts-ignore
import statusColors from '../shared/StatusColors.css?inline';

const sheet = new CSSStyleSheet();
sheet.replaceSync(badgeStyles);

const colorSheet = new CSSStyleSheet();
colorSheet.replaceSync(statusColors);

class StatusBadge extends HTMLElement {
  static get observedAttributes() {
    return ['status'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet, colorSheet];
    }
  }

  // This runs whenever you change the "status" attribute
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null) {
    if (name === 'status') {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const status = this.getAttribute('status') || 'Unknown';
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = `<span class="badge status-indicator">${status}</span>`;
    }
  }
}

customElements.define('status-badge', StatusBadge);

declare global {
  interface HTMLElementTagNameMap {
    'status-badge': StatusBadge;
  }
}
