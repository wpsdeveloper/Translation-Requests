// @ts-ignore
import template from './DetailsTranslation.htm?raw';
import '../ContractorSelect/ContractorSelect';
import { DetailsBase } from '../shared/DetailsBase';

class DetailsTranslation extends DetailsBase {
  protected get template() {
    return template;
  }

  getSaveData() {
    const contractorData = (this.shadowRoot?.querySelector('#contractor-select') as any)?.getSaveData() || {};
    return {
      ...super.getSaveData(),
      ...contractorData,
    };
  }
}

customElements.define('details-translation', DetailsTranslation);

declare global {
  interface HTMLElementTagNameMap {
    'details-translation': DetailsTranslation;
  }
}
