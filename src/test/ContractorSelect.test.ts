import { describe, it, expect, beforeEach, vi } from 'vitest';
import '../client/components/ContractorSelect/ContractorSelect';

describe('ContractorSelect', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render the current contractor name', () => {
    const el = document.createElement('contractor-select') as any;
    el.value = { contractor: 'Lexikeet', name: 'Lexikeet' };
    el.mode = 'view';
    container.appendChild(el);
    
    expect(el.shadowRoot.querySelector('#view-value').textContent).toBe('Lexikeet');
  });

  it('should allow changing contractor in process mode', () => {
    const el = document.createElement('contractor-select') as any;
    el.mode = 'edit'; // ContractorSelect uses 'edit' for interactivity
    container.appendChild(el);
    
    const changeSpy = vi.fn();
    el.addEventListener('change', changeSpy);

    const dropdown = el.shadowRoot.querySelector('#contractor-dropdown');
    dropdown.value = 'MAPA';
    dropdown.dispatchEvent(new Event('change'));

    expect(changeSpy).toHaveBeenCalled();
    expect(changeSpy.mock.calls[0][0].detail.contractor).toBe('MAPA');
  });
});
