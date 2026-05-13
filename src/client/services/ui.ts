// toast.ts
export const showToast = (message: string, duration = 3000) => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    container?.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, duration);
};

// modal.ts
export const showModal = (title: string, body: string, onConfirm?: () => void) => {
    const modal = document.getElementById('app-modal') as HTMLDialogElement;
    const titleEl = document.getElementById('modal-title')!;
    const bodyEl = document.getElementById('modal-body')!;
    const confirmBtn = document.getElementById('modal-confirm') as HTMLButtonElement;
    const closeBtn = document.getElementById('modal-close')!;

    titleEl.textContent = title;
    bodyEl.textContent = body;

    if (onConfirm) {
        confirmBtn.style.display = 'block';
        confirmBtn.onclick = () => {
            onConfirm();
            modal.close();
        };
    } else {
        confirmBtn.style.display = 'none';
    }

    closeBtn.onclick = () => modal.close();

    modal.showModal(); // This is the native method
};