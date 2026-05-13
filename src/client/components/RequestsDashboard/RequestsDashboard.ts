// @ts-ignore
import RequestsDashboardStyles from './RequestsDashboard.css?inline';
// @ts-ignore
import RequestsDashboardTemplate from './RequestsDashboard.htm?raw';
import { store } from '../../services/state';
import '../RequestsRow/RequestsRow'; // Ensure the row component is registered

const sheet = new CSSStyleSheet();
sheet.replaceSync(RequestsDashboardStyles);

/**
 * RequestsDashboard: A reactive custom element that displays the list of requests.
 * It subscribes to the global store and automatically re-renders when
 * filters or data change.
 */
class RequestsDashboard extends HTMLElement {
  constructor() {
    super();
    // Use 'open' mode so we can access the shadowRoot from the outside if needed,
    // though we primarily manage it internally.
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      // Use adoptedStyleSheets for better performance and style sharing.
      // This allows the browser to parse the CSS only once.
      this.shadowRoot.adoptedStyleSheets = [sheet];
    }
  }

  /**
   * connectedCallback is called when the element is added to the document.
   * This is where we trigger the initial render and set up subscriptions.
   */
  connectedCallback() {
    this.render();
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = RequestsDashboardTemplate;
    }
  }
}

customElements.define('requests-dashboard', RequestsDashboard);

declare global {
  interface HTMLElementTagNameMap {
    'requests-dashboard': RequestsDashboard;
  }
}
