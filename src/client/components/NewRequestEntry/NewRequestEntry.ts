import { store } from '../../services/state';
import { uploadFile } from '../../services/api';
import { requestActions } from '../../services/actions';

// @ts-ignore
import template from './NewRequestEntry.htm?raw';
// @ts-ignore
import shared from '../shared/SharedStyles.css?inline';
import styles from './NewRequestEntry.css?inline';

import { SlidingPanel } from '../shared/SlidingPanel';

const sheet = new CSSStyleSheet();
sheet.replaceSync(styles);

const sharedSheet = new CSSStyleSheet();
sharedSheet.replaceSync(shared);

class NewRequestEntry extends HTMLElement {
  private _currentStep = 1;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    if (this.shadowRoot) {
      this.shadowRoot.adoptedStyleSheets = [sharedSheet, sheet];
    }
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  protected onOpen() {
    this.shadowRoot?.getElementById('editor-overlay')?.classList.add('active');
    this.resetForm();
  }

  protected onClose() {
    this.shadowRoot?.getElementById('editor-overlay')?.classList.remove('active');
  }

  render() {
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = template;
    }
  }

  getRadioValue(name: string): string {
    const root = this.shadowRoot;
    if (!root) return '';
    const checked = root.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
    return checked ? checked.value : '';
  }

  setupEventListeners() {
    const root = this.shadowRoot;
    if (!root) return;

    const nextBtn = root.getElementById('next-btn') as HTMLButtonElement;
    const prevBtn = root.getElementById('prev-btn') as HTMLButtonElement;
    const submitBtn = root.getElementById('submit-btn') as HTMLButtonElement;

    nextBtn?.addEventListener('click', () => this.goToStep(2));
    prevBtn?.addEventListener('click', () => this.goToStep(1));

    const form = root.getElementById('request-form') as HTMLFormElement;
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Handle Type Change (Radios)
    root.querySelectorAll('input[name="req-type"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        this.handleTypeChange();
        this.validateStep1();
      });
    });

    // File upload logic
    const fileInput = root.getElementById('file-upload') as HTMLInputElement;
    const statusDiv = root.getElementById('upload-status');
    const linkInput = root.getElementById('req-doc-link') as HTMLInputElement;

    fileInput?.addEventListener('change', async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      if (statusDiv) statusDiv.textContent = `Uploading ${file.name}...`;

      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = reader.result as string;
            const url = await uploadFile(base64, file.name, file.type);
            if (linkInput) linkInput.value = url;
            if (statusDiv) statusDiv.textContent = 'Upload successful!';
          } catch (err) {
            if (statusDiv) statusDiv.textContent = 'Upload failed.';
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        if (statusDiv) statusDiv.textContent = 'Failed to read file.';
      }
    });

    // Validation for Step 1
    const nameInput = root.getElementById('req-name') as HTMLInputElement;
    const schoolSelect = root.getElementById('req-school') as any;

    const validate = () => this.validateStep1();
    nameInput?.addEventListener('input', validate);
    schoolSelect?.addEventListener('change', validate);

    // Auto-fill user data
    store.subscribe((state) => {
      if (state.user) {
        const emailInput = root.getElementById('req-email') as HTMLInputElement;
        const nameInput = root.getElementById('req-name') as HTMLInputElement;
        if (emailInput) emailInput.value = state.user.email;
        if (nameInput && !nameInput.value) nameInput.value = state.user.name;
        this.validateStep1();
      }
    });
  }

  validateStep1() {
    const root = this.shadowRoot;
    if (!root) return;

    const type = this.getRadioValue('req-type');
    const school = (root.getElementById('req-school') as any).value;
    const name = (root.getElementById('req-name') as HTMLInputElement).value;
    const nextBtn = root.getElementById('next-btn') as HTMLButtonElement;

    if (nextBtn) {
      nextBtn.disabled = !(type && school && name);
    }
  }

  goToStep(step: number) {
    const root = this.shadowRoot;
    if (!root) return;

    this._currentStep = step;

    root.querySelectorAll('.form-step').forEach((el: any) => {
      el.classList.toggle('active', parseInt(el.id.split('-')[1]) === step);
    });

    root.querySelectorAll('.step').forEach((el: any) => {
      const s = parseInt(el.dataset.step);
      el.classList.toggle('active', s === step);
      el.classList.toggle('completed', s < step);
    });

    const nextBtn = root.getElementById('next-btn') as HTMLElement;
    const prevBtn = root.getElementById('prev-btn') as HTMLElement;
    const submitBtn = root.getElementById('submit-btn') as HTMLElement;

    if (step === 1) {
      nextBtn.style.display = 'inline-block';
      prevBtn.style.display = 'none';
      submitBtn.style.display = 'none';
    } else {
      nextBtn.style.display = 'none';
      prevBtn.style.display = 'inline-block';
      submitBtn.style.display = 'inline-block';
    }
  }

  handleTypeChange() {
    const root = this.shadowRoot;
    if (!root) return;

    const type = this.getRadioValue('req-type');

    root.querySelectorAll('.type-section').forEach((el: any) => {
      el.style.display = 'none';
    });

    if (type === 'Translation') {
      (root.querySelector('.translation-only') as HTMLElement).style.display = 'block';
    } else if (type === 'Interpretation') {
      (root.querySelector('.interpretation-only') as HTMLElement).style.display = 'block';
    }
  }

  resetForm() {
    const root = this.shadowRoot;
    if (!root) return;
    const form = root.getElementById('request-form') as HTMLFormElement;
    form.reset();
    this.goToStep(1);

    root.querySelectorAll('.type-section').forEach((el: any) => {
      el.style.display = 'none';
    });

    const statusDiv = root.getElementById('upload-status');
    if (statusDiv) statusDiv.textContent = '';

    const user = store.getState().user;
    if (user) {
      const emailInput = root.getElementById('req-email') as HTMLInputElement;
      const nameInput = root.getElementById('req-name') as HTMLInputElement;
      if (emailInput) emailInput.value = user.email;
      if (nameInput) nameInput.value = user.name;
    }
    this.validateStep1();
  }

  async handleSubmit() {
    const root = this.shadowRoot;
    if (!root) return;

    const submitBtn = root.getElementById('submit-btn') as HTMLButtonElement;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    try {
      const type = this.getRadioValue('req-type');

      const newRequest: any = {
        name: (root.getElementById('req-name') as HTMLInputElement).value,
        email: (root.getElementById('req-email') as HTMLInputElement).value,
        school: (root.getElementById('req-school') as any).value,
        reqType: type,
        originalLanguage: (root.getElementById('req-orig-lang') as HTMLInputElement).value,
        targetLanguage: (root.getElementById('req-target-lang') as HTMLInputElement).value,
        description: (root.getElementById('req-description') as HTMLTextAreaElement).value,
      };

      if (type === 'Translation') {
        newRequest.requestDate = (root.getElementById('req-date-needed') as HTMLInputElement).value;
        newRequest.docPageCount = (root.getElementById('req-pages') as HTMLInputElement).value;
        newRequest.docLink = (root.getElementById('req-doc-link') as HTMLInputElement).value;
      } else {
        newRequest.interpretationType = this.getRadioValue('req-interp-type');
        newRequest.requestDate = (root.getElementById('req-date-event') as HTMLInputElement).value;
        newRequest.startTime = (root.getElementById('req-start-time') as HTMLInputElement).value;
        newRequest.endTime = (root.getElementById('req-end-time') as HTMLInputElement).value;
        newRequest.eventLocation = (root.getElementById('req-location') as HTMLInputElement).value;
      }

      await requestActions.create(newRequest);

      //Emit event for RequestEntry to know it's done
      this.dispatchEvent(new CustomEvent('request-submitted', { bubbles: true }));
    } catch (err) {
      // Error is handled by service
    } finally {
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    }
  }
}

customElements.define('new-request-entry', NewRequestEntry);

declare global {
  interface HTMLElementTagNameMap {
    'new-request-entry': NewRequestEntry;
  }
}
