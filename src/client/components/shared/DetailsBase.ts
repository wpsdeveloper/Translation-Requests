// @ts-ignore
import styles from './SharedStyles.css?inline';
import detailStyles from './DetailsStyles.css?inline';
import { TranslationRequest } from '../../../shared/types';
import { PanelMode } from '../DetailsPanel/DetailsPanel';
import { formatDate, formatTime } from '../../services/utils';
import { BasePanel } from './BasePanel';

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(styles);

const detailSheet = new CSSStyleSheet();
detailSheet.replaceSync(detailStyles);

export abstract class DetailsBase extends BasePanel {
  protected _data: TranslationRequest = {} as TranslationRequest;
  protected _mode: PanelMode = 'view';
  protected abstract get template(): string;

  constructor() {
    super();
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, detailSheet];
    }
  }

  set data(value: TranslationRequest) {
    this._data = value;
    this.render();
  }

  get mode(): PanelMode {
    return this._mode;
  }

  set mode(value: PanelMode) {
    this._mode = value;
    this.setAttribute('mode', value);
    const root = this.shadowRoot;
    if (!root) return;
    this.applyMode(root, value);
  }

  render() {
    const root = this.shadowRoot;
    if (!root) return;

    root.innerHTML = this.template;
    this.autoHydrate(root);
    this.hydrate(root);
    this.applyMode(root, this._mode);
  }

  /**
   * Automatically populates elements with [data-bind] attributes
   */
  protected autoHydrate(root: ShadowRoot) {
    const elements = root.querySelectorAll('[data-bind]');
    elements.forEach((el) => {
      const prop = el.getAttribute('data-bind') as keyof TranslationRequest;
      if (!prop) return;

      const value = (this._data as any)[prop];
      if (value === undefined || value === null) return;

      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
        if (el.type === 'date') {
          el.value = value ? new Date(value).toISOString().split('T')[0] : '';
        } else if (el.type === 'time') {
          el.value = value ? new Date(value).toTimeString().slice(0, 5) : '';
        } else {
          el.value = value;
        }
      } else {
        // For view mode elements
        const format = el.getAttribute('data-format');
        if (format === 'date') {
          el.textContent = value ? formatDate(value, 'MMM D, YYYY') : 'N/A';
        } else if (format === 'time') {
          el.textContent = value ? formatTime(value, 'h:mm A') : 'N/A';
        } else {
          el.textContent = value || 'N/A';
        }

        if (el instanceof HTMLAnchorElement) {
          el.href = value || '#';
          el.style.display = value ? 'inline' : 'none';
        }
      }
    });
  }

  /**
   * Automatically gathers data from elements with [data-bind] attributes
   */
  public getSaveData(): any {
    const root = this.shadowRoot;
    if (!root) return {};

    const data: any = {};
    const elements = root.querySelectorAll('input[data-bind], select[data-bind], textarea[data-bind]');

    elements.forEach((el) => {
      const prop = el.getAttribute('data-bind');
      if (prop) {
        data[prop] = (el as HTMLInputElement).value;
      }
    });

    return data;
  }

  /**
   * Hook for sub-classes to handle custom hydration logic
   */
  protected hydrate(_root: ShadowRoot): void { }

  /**
   * Hook for sub-classes to handle custom mode logic (rarely needed with declarative CSS)
   */
  protected applyMode(root: ShadowRoot, _mode: PanelMode): void {
    const contractorSelect = root.querySelector('#contractor-select') as any;
    if (contractorSelect) {
      contractorSelect.mode = this._mode === 'process' ? 'edit' : 'view';
      contractorSelect.value = {
        contractor: this._data.contractor,
        name: this._data.contractorName,
      };
    }
  }
}
