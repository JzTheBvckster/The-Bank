"use strict";

/**
 * Error Handler Module for SecureBank Application
 * Centralized error handling and logging
 * @module core/errorHandler
 */

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code
     */
    constructor(message, code) {
        super(message);
        this.name = 'AuthError';
        this.code = code;
    }
}

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} code - Error code
     */
    constructor(message, code) {
        super(message);
        this.name = 'ApiError';
        this.code = code;
    }
}

/**
 * Custom error class for validation errors
 */
class ValidationError extends Error {
    /**
     * @param {string} message - Error message
     * @param {string} field - Field that failed validation
     */
    constructor(message, field) {
        super(message);
        this.name = 'ValidationError';
        this.field = field;
    }
}

// Error log storage (in production, send to logging service)
const errorLog = [];

/**
 * Handle and log errors
 * @param {Error} error - Error object
 * @param {string} context - Context where error occurred
 * @param {boolean} showToUser - Whether to show error to user
 */
function handleError(error, context = 'Unknown', showToUser = true) {
    // Log error details
    const errorDetails = {
        timestamp: new Date().toISOString(),
        context: context,
        name: error.name,
        message: error.message,
        code: error.code || 'UNKNOWN_ERROR',
        stack: error.stack
    };

    // Store in error log
    errorLog.push(errorDetails);

    // Console log in development
    console.error(`[${context}] Error:`, error);

    // Show user-friendly message
    if (showToUser) {
        showErrorMessage(getUserFriendlyMessage(error));
    }

    // In production, send to logging service
    // sendToLoggingService(errorDetails);
}

/**
 * Get user-friendly error message
 * @param {Error} error - Error object
 * @returns {string} User-friendly message
 */
function getUserFriendlyMessage(error) {
    // Check for custom error types
    if (error instanceof AuthError || error instanceof ApiError) {
        return error.message;
    }

    if (error instanceof ValidationError) {
        return `Invalid input: ${error.message}`;
    }

    // Check for network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return 'Network error. Please check your internet connection and try again.';
    }

    // Check for Firebase errors
    if (error.code && error.code.startsWith('auth/')) {
        return getFirebaseAuthErrorMessage(error.code);
    }

    // Generic error
    return 'Something went wrong. Please try again later.';
}

/**
 * Get user-friendly message for Firebase auth errors
 * @param {string} code - Firebase error code
 * @returns {string} User-friendly message
 */
function getFirebaseAuthErrorMessage(code) {
    const messages = {
        'auth/email-already-in-use': 'This email is already registered.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'This operation is not allowed.',
        'auth/weak-password': 'Please use a stronger password.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
        'auth/invalid-credential': 'Invalid credentials. Please try again.'
    };

    return messages[code] || 'Authentication error. Please try again.';
}

/**
 * Show error message in UI
 * @param {string} message - Message to display
 */
function showErrorMessage(message) {
    // Check if toast function is available
    if (typeof window !== 'undefined') {
        // Create error toast if not using shared utility
        const existingToast = document.querySelector('.error-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.setAttribute('role', 'alert');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 8px;
            background: #ef4444;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideInError 0.3s ease;
        `;

        // Add animation styles
        if (!document.querySelector('#error-toast-styles')) {
            const styles = document.createElement('style');
            styles.id = 'error-toast-styles';
            styles.textContent = `
                @keyframes slideInError {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutError {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(styles);
        }

        toast.textContent = `⚠ ${message}`;
        document.body.appendChild(toast);

        // Remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'slideOutError 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }
}

/**
 * Show success message in UI
 * @param {string} message - Message to display
 */
function showSuccessMessage(message) {
    if (typeof window !== 'undefined') {
        const existingToast = document.querySelector('.success-toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = 'success-toast';
        toast.setAttribute('role', 'status');
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 8px;
            background: #10b981;
            color: white;
            font-weight: 500;
            z-index: 9999;
            animation: slideInError 0.3s ease;
        `;

        toast.textContent = `✓ ${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutError 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

/**
 * Validate form fields
 * @param {Object} fields - Object with field name and value pairs
 * @param {Object} rules - Validation rules for each field
 * @returns {Object} Validation result with errors
 */
function validateForm(fields, rules) {
    const errors = {};

    Object.entries(rules).forEach(([fieldName, fieldRules]) => {
        const value = fields[fieldName];

        fieldRules.forEach(rule => {
            // Required check
            if (rule.required && (!value || value.trim() === '')) {
                errors[fieldName] = rule.message || `${fieldName} is required`;
                return;
            }

            // Skip other validations if field is empty and not required
            if (!value) return;

            // Min length
            if (rule.minLength && value.length < rule.minLength) {
                errors[fieldName] = rule.message || `${fieldName} must be at least ${rule.minLength} characters`;
            }

            // Max length
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[fieldName] = rule.message || `${fieldName} must be less than ${rule.maxLength} characters`;
            }

            // Pattern
            if (rule.pattern && !rule.pattern.test(value)) {
                errors[fieldName] = rule.message || `${fieldName} is invalid`;
            }

            // Custom validator
            if (rule.validator && typeof rule.validator === 'function') {
                const result = rule.validator(value, fields);
                if (result !== true) {
                    errors[fieldName] = result || rule.message || `${fieldName} is invalid`;
                }
            }
        });
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Display form errors
 * @param {Object} errors - Error object with field names and messages
 */
function displayFormErrors(errors) {
    // Clear existing errors
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });

    document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
        el.classList.remove('error');
    });

    // Display new errors
    Object.entries(errors).forEach(([fieldName, message]) => {
        const input = document.querySelector(`[name="${fieldName}"]`);
        if (input) {
            input.classList.add('error');

            const errorEl = document.querySelector(`#${fieldName}-error`) ||
                input.parentElement.querySelector('.form-error');
            if (errorEl) {
                errorEl.textContent = message;
                errorEl.style.display = 'block';
            }
        }
    });
}

/**
 * Clear all form errors
 */
function clearFormErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.style.display = 'none';
    });

    document.querySelectorAll('.form-input.error, .form-select.error').forEach(el => {
        el.classList.remove('error');
    });
}

/**
 * Get error log (for debugging)
 * @returns {Array} Array of error log entries
 */
function getErrorLog() {
    return [...errorLog];
}

/**
 * Clear error log
 */
function clearErrorLog() {
    errorLog.length = 0;
}

export {
    AuthError,
    ApiError,
    ValidationError,
    handleError,
    getUserFriendlyMessage,
    showErrorMessage,
    showSuccessMessage,
    validateForm,
    displayFormErrors,
    clearFormErrors,
    getErrorLog,
    clearErrorLog
};
