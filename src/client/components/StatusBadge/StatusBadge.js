import badgeStyles from './StatusBadge.css?inline';

const sheet = new CSSStyleSheet();
sheet.replaceSync(badgeStyles);

class StatusBadge extends HTMLElement {
  static get observedAttributes() {
    return ['status'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  // This runs whenever you change the "status" attribute
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'status') {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const status = this.getAttribute('status') || 'Unknown';
    this.shadowRoot.innerHTML = `<span class="badge">${status}</span>`;
  }
}

customElements.define('status-badge', StatusBadge);