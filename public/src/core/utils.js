"use strict";

/**
 * Utility Functions for SecureBank Application
 * Contains reusable helper functions
 * @module core/utils
 */

/**
 * Initialize theme from localStorage or system preference
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        document.body.className = savedTheme;
    } else if (prefersDark) {
        document.body.className = 'theme-dark';
    } else {
        document.body.className = 'theme-light';
    }
}

/**
 * Toggle between light and dark theme
 * @returns {boolean} True if dark theme is now active
 */
function toggleTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    const newTheme = isDark ? 'theme-light' : 'theme-dark';

    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);

    return !isDark;
}

/**
 * Get current theme
 * @returns {string} Current theme ('theme-light' or 'theme-dark')
 */
function getCurrentTheme() {
    return document.body.classList.contains('theme-dark') ? 'theme-dark' : 'theme-light';
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format date for display
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
    const defaultOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    const dateObj = date?.toDate ? date.toDate() : new Date(date);

    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Format date and time for display
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Formatted date and time string
 */
function formatDateTime(date) {
    return formatDate(date, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|Object} date - Date object or Firestore timestamp
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    const now = new Date();
    const diff = now - dateObj;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return formatDate(dateObj);
    }
}

/**
 * Sanitize user input to prevent XSS
 * @param {string} input - User input string
 * @returns {string} Sanitized string
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}

/**
 * Create element safely without innerHTML
 * @param {string} tag - HTML tag name
 * @param {Object} attributes - Element attributes
 * @param {string|Node|Array} children - Child content
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attributes = {}, children = null) {
    const element = document.createElement(tag);

    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });

    // Add children
    if (children) {
        if (Array.isArray(children)) {
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof Node) {
                    element.appendChild(child);
                }
            });
        } else if (typeof children === 'string') {
            element.textContent = children;
        } else if (children instanceof Node) {
            element.appendChild(children);
        }
    }

    return element;
}

/**
 * Create an SVG icon element using the shared sprite
 * @param {string} id - Symbol id in /assets/icons/sprite.svg
 * @param {Object} options
 * @param {string} options.className - CSS class to apply
 * @returns {SVGSVGElement}
 */
function createIcon(id, { className = 'icon' } = {}) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('focusable', 'false');

    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    const href = `/assets/icons/sprite.svg#${id}`;
    use.setAttribute('href', href);
    use.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', href);
    svg.appendChild(use);

    return svg;
}

/**
 * Debounce function to limit rate of function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;

    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit rate of function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
function throttle(func, limit = 300) {
    let inThrottle;

    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid and message
 */
function validatePassword(password) {
    if (password.length < 8) {
        return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
        return { isValid: false, message: 'Password must contain at least one number' };
    }
    return { isValid: true, message: 'Password is strong' };
}

/**
 * Mask account number for display
 * @param {string} accountNumber - Full account number
 * @returns {string} Masked account number
 */
function maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) return accountNumber;
    const lastFour = accountNumber.slice(-4);
    return `****${lastFour}`;
}

/**
 * Generate unique ID
 * @returns {string} Unique ID string
 */
function generateId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element
 */
function showLoading(container) {
    const spinner = createElement('div', { className: 'spinner' });
    const overlay = createElement('div', { className: 'loading-overlay' }, spinner);
    overlay.id = 'loading-overlay';
    container.appendChild(overlay);
}

/**
 * Hide loading spinner
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.remove();
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Toast type (success, error, warning, info)
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', duration = 3000) {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }

    const icons = {
        success: createIcon('check'),
        error: createIcon('error'),
        warning: createIcon('warning'),
        info: createIcon('info')
    };

    const toast = createElement('div', {
        className: `toast toast-${type}`,
        role: 'alert'
    }, [
        createElement('span', { className: 'toast-icon' }, icons[type] || icons.info),
        createElement('span', { className: 'toast-message' }, message)
    ]);

    // Add toast styles if not present
    if (!document.querySelector('#toast-styles')) {
        const styles = document.createElement('style');
        styles.id = 'toast-styles';
        styles.textContent = `
            .toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                animation: slideIn 0.3s ease;
            }
            .toast-success { background: #10b981; }
            .toast-error { background: #ef4444; }
            .toast-warning { background: #f59e0b; }
            .toast-info { background: #3b82f6; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(styles);
    }

    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Whether copy was successful
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Parse query parameters from URL
 * @param {string} url - URL to parse (default: current URL)
 * @returns {Object} Object with query parameters
 */
function parseQueryParams(url = window.location.href) {
    const params = new URLSearchParams(new URL(url).search);
    const result = {};

    params.forEach((value, key) => {
        result[key] = value;
    });

    return result;
}

/**
 * Navigate to a page
 * @param {string} path - Path to navigate to
 */
function navigateTo(path) {
    window.location.href = path;
}

/**
 * Check if user is on mobile device
 * @returns {boolean} Whether user is on mobile
 */
function isMobile() {
    return window.innerWidth < 768;
}

export {
    initTheme,
    toggleTheme,
    getCurrentTheme,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatRelativeTime,
    sanitizeInput,
    createElement,
    createIcon,
    debounce,
    throttle,
    isValidEmail,
    validatePassword,
    maskAccountNumber,
    generateId,
    showLoading,
    hideLoading,
    showToast,
    copyToClipboard,
    parseQueryParams,
    navigateTo,
    isMobile
};
