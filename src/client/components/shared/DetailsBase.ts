// @ts-ignore
import styles from './DetailsStyles.css?inline';
import { TranslationRequest } from '../../../shared/types';
import { PanelMode } from '../DetailsPanel/DetailsPanel';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

export abstract class DetailsBase extends HTMLElement {
  protected _data: TranslationRequest = {} as TranslationRequest;
  protected _mode: PanelMode = 'view';
  protected abstract get template(): string;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sheet];
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
    const root = this.shadowRoot;
    if (!root) return;
    this.applyMode(root, value);
  }

  render() {
    const root = this.shadowRoot;
    if (!root) return;

    root.innerHTML = this.template;
    this.hydrate(root);
    this.applyMode(root, this._mode);
  }

  protected abstract hydrate(root: ShadowRoot): void;
  protected abstract applyMode(root: ShadowRoot, mode: PanelMode): void;
  public abstract getSaveData(): any;
}
