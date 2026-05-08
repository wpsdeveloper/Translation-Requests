import { store } from '../../services/state.js';
import { formatDate } from '../../services/utils.js';
import panelTemplate from './DetailsPanel.htm?raw';
import panelStyles from './DetailsPanel.css?inline';

import '../DetailsInterpretation/DetailsInterpretation.js';
import '../DetailsTranslation/DetailsTranslation.js';

const sheet = new CSSStyleSheet();
sheet.replaceSync(panelStyles);

class DetailsPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  connectedCallback() {
    this.render();

    // Subscribe to the store to react when a row is clicked
    store.subscribe((state) => {
      if (state.selectedRow) {
        this.hydrate(state.selectedRow);
        this.classList.add('open'); // Show panel
      } else {
        this.classList.remove('open'); // Hide panel
      }
    });
    
    this.shadowRoot.addEventListener('click', (e) => {
      if (e.target.id === 'close-btn') store.setState({ selectedRow: null });
    });
  }

  render() {
    this.shadowRoot.innerHTML = panelTemplate;
  }

  hydrate(data) {
    const root = this.shadowRoot;

    // 1. Hydrate Shared Fields
    root.querySelector('#detail-status').setAttribute('status', data.status);
    root.querySelector('#detail-submitted').textContent = formatDate(data.submittedDate, "MMM D, YYYY");
    root.querySelector('#detail-reqType').textContent = data.reqType;
    root.querySelector('#detail-requester').textContent = `${data.name} (${data.school})`;
    root.querySelector('#detail-languages').textContent = `${data.originalLanguage} to ${data.targetLanguage}`;
    root.querySelector('#detail-description').textContent = data.description || 'No description provided.';

    // 2. Hydrate Dynamic Content
    const container = root.querySelector('#dynamic-content');
    container.innerHTML = ''; // Clear previous view
    
    let featureEl;
    if (data.reqType === 'Interpretation') {
      featureEl = document.createElement('details-interpretation');
    } else if (data.reqType === 'Translation') {
      featureEl = document.createElement('details-translation');
    }

    if (featureEl) {
      container.appendChild(featureEl);
      featureEl.data = data; // Push data into the new component
    }
  }
}

customElements.define('details-panel', DetailsPanel);