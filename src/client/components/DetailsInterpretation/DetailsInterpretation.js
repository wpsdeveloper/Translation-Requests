import styles from './DetailsInterpretation.css?inline';
import template from './DetailsInterpretation.htm?raw';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

class DetailsInterpretation extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
    this._data = {};
  }

  set data(value) {
    this._data = value;
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = template;
    // Hydrate
    this.shadowRoot.querySelector('.lang').textContent = this._data.language || 'N/A';
    this.shadowRoot.querySelector('.loc').textContent = this._data.location || 'N/A';
    this.shadowRoot.querySelector('.time').textContent = this._data.meetingTime || 'N/A';
  }
}

customElements.define('details-interpretation', DetailsInterpretation);