// @ts-ignore
import template from './DetailsInterpretation.htm?raw';
import '../ContractorSelect/ContractorSelect';
import { formatTime } from '../../services/utils';
import { DetailsBase } from '../shared/DetailsBase';

class DetailsInterpretation extends DetailsBase {
  protected get template() {
    return template;
  }

  protected hydrate(root: ShadowRoot) {
    // Custom hydration for the time range string in view mode
    const startStr = this._data.startTime ? formatTime(this._data.startTime, 'h:mm A') : '';
    const endStr = this._data.endTime ? formatTime(this._data.endTime, 'h:mm A') : '';
    const viewEventTime = root.querySelector('#view-event-time');
    if (viewEventTime) {
      viewEventTime.textContent = startStr && endStr ? `${startStr} to ${endStr}` : startStr || endStr || 'N/A';
    }
  }

  getSaveData() {
    const contractorData = (this.shadowRoot?.querySelector('#contractor-select') as any)?.getSaveData() || {};
    return {
      ...super.getSaveData(),
      ...contractorData,
    };
  }
}

customElements.define('details-interpretation', DetailsInterpretation);

declare global {
  interface HTMLElementTagNameMap {
    'details-interpretation': DetailsInterpretation;
  }
}
