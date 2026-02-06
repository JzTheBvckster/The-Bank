/**
 * Modal Component
 * Reusable modal dialog component
 */

/**
 * Modal state management
 */
const modalStack = [];

/**
 * Create a modal element
 * @param {Object} options - Modal options
 * @param {string} options.id - Modal ID
 * @param {string} options.title - Modal title
 * @param {string|HTMLElement} options.content - Modal body content
 * @param {Array} options.actions - Modal footer actions
 * @param {string} options.size - Modal size (sm, md, lg, xl)
 * @param {boolean} options.closable - Whether modal can be closed
 * @param {Function} options.onClose - Callback when modal closes
 * @returns {HTMLElement} Modal element
 */
export function createModal(options = {}) {
    const {
        id = `modal-${Date.now()}`,
        title = 'Modal',
        content = '',
        actions = [],
        size = 'md',
        closable = true,
        onClose = null
    } = options;

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = id;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', `${id}-title`);

    // Overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    if (closable) {
        overlay.addEventListener('click', () => closeModal(id, onClose));
    }

    // Content container
    const contentContainer = document.createElement('div');
    contentContainer.className = `modal-content${size !== 'md' ? ` modal-${size}` : ''}`;

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const titleElement = document.createElement('h2');
    titleElement.id = `${id}-title`;
    titleElement.textContent = title;
    header.appendChild(titleElement);

    if (closable) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'modal-close';
        closeBtn.setAttribute('aria-label', 'Close modal');
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => closeModal(id, onClose));
        header.appendChild(closeBtn);
    }

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body';

    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }

    // Footer (if actions provided)
    let footer = null;
    if (actions.length > 0) {
        footer = document.createElement('div');
        footer.className = 'modal-footer';

        actions.forEach(action => {
            const btn = document.createElement('button');
            btn.className = `btn ${action.className || 'btn-primary'}`;
            btn.textContent = action.text;
            btn.type = action.type || 'button';

            if (action.id) {
                btn.id = action.id;
            }

            if (action.onClick) {
                btn.addEventListener('click', action.onClick);
            }

            if (action.dismiss) {
                btn.addEventListener('click', () => closeModal(id, onClose));
            }

            footer.appendChild(btn);
        });
    }

    // Assemble modal
    contentContainer.appendChild(header);
    contentContainer.appendChild(body);
    if (footer) {
        contentContainer.appendChild(footer);
    }

    modal.appendChild(overlay);
    modal.appendChild(contentContainer);

    // Handle escape key
    modal.handleKeydown = (e) => {
        if (e.key === 'Escape' && closable) {
            closeModal(id, onClose);
        }
    };

    return modal;
}

/**
 * Open a modal
 * @param {string|HTMLElement} modal - Modal ID or element
 */
export function openModal(modal) {
    let modalElement;

    if (typeof modal === 'string') {
        modalElement = document.getElementById(modal);
    } else {
        modalElement = modal;
    }

    if (!modalElement) {
        console.error('Modal not found:', modal);
        return;
    }

    // Add to DOM if not already there
    if (!modalElement.parentElement) {
        document.body.appendChild(modalElement);
    }

    // Add to stack
    modalStack.push(modalElement.id);

    // Add event listener for escape key
    if (modalElement.handleKeydown) {
        document.addEventListener('keydown', modalElement.handleKeydown);
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Show modal
    modalElement.classList.add('active');

    // Focus first focusable element
    const focusable = modalElement.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) {
        focusable.focus();
    }
}

/**
 * Close a modal
 * @param {string} modalId - Modal ID
 * @param {Function} onClose - Optional callback
 */
export function closeModal(modalId, onClose = null) {
    const modalElement = document.getElementById(modalId);

    if (!modalElement) {
        return;
    }

    // Remove from stack
    const index = modalStack.indexOf(modalId);
    if (index > -1) {
        modalStack.splice(index, 1);
    }

    // Remove event listener
    if (modalElement.handleKeydown) {
        document.removeEventListener('keydown', modalElement.handleKeydown);
    }

    // Restore body scroll if no more modals
    if (modalStack.length === 0) {
        document.body.style.overflow = '';
    }

    // Hide modal
    modalElement.classList.remove('active');

    // Call callback
    if (onClose) {
        onClose();
    }
}

/**
 * Close all open modals
 */
export function closeAllModals() {
    [...modalStack].forEach(modalId => {
        closeModal(modalId);
    });
}

/**
 * Show a confirmation modal
 * @param {Object} options - Confirmation options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Confirmation message
 * @param {string} options.confirmText - Confirm button text
 * @param {string} options.cancelText - Cancel button text
 * @param {string} options.confirmClass - Confirm button class
 * @returns {Promise<boolean>} Resolves to true if confirmed
 */
export function confirm(options = {}) {
    const {
        title = 'Confirm',
        message = 'Are you sure?',
        confirmText = 'Confirm',
        cancelText = 'Cancel',
        confirmClass = 'btn-primary'
    } = options;

    return new Promise((resolve) => {
        const modal = createModal({
            title,
            content: `<p>${message}</p>`,
            actions: [
                {
                    text: cancelText,
                    className: 'btn-outline',
                    onClick: () => {
                        closeModal(modal.id);
                        resolve(false);
                    }
                },
                {
                    text: confirmText,
                    className: confirmClass,
                    onClick: () => {
                        closeModal(modal.id);
                        resolve(true);
                    }
                }
            ],
            onClose: () => resolve(false)
        });

        document.body.appendChild(modal);
        openModal(modal);
    });
}

/**
 * Show an alert modal
 * @param {Object} options - Alert options
 * @param {string} options.title - Modal title
 * @param {string} options.message - Alert message
 * @param {string} options.buttonText - Button text
 * @returns {Promise<void>} Resolves when closed
 */
export function alert(options = {}) {
    const {
        title = 'Alert',
        message = '',
        buttonText = 'OK'
    } = options;

    return new Promise((resolve) => {
        const modal = createModal({
            title,
            content: `<p>${message}</p>`,
            actions: [
                {
                    text: buttonText,
                    className: 'btn-primary',
                    onClick: () => {
                        closeModal(modal.id);
                        resolve();
                    }
                }
            ],
            onClose: () => resolve()
        });

        document.body.appendChild(modal);
        openModal(modal);
    });
}

export default {
    createModal,
    openModal,
    closeModal,
    closeAllModals,
    confirm,
    alert
};
