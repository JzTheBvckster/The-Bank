"use strict";

/**
 * Authentication Feature Module
 * Handles login, registration, and password reset functionality
 * @module features/auth/auth
 */

import { initAuth, registerUser, signIn, resetPassword, isAuthenticated, getCurrentUser } from '../../core/auth.js';
import { initializeFirebase } from '../../core/firebase.js';
import { handleError, validateForm, displayFormErrors, clearFormErrors, showSuccessMessage } from '../../core/errorHandler.js';
import { initTheme, toggleTheme, isValidEmail, validatePassword, debounce } from '../../core/utils.js';

// Track focus so we can restore it when closing modals
const modalReturnFocus = new Map();

/**
 * Initialize authentication page
 */
async function initAuthPage() {
    // Initialize theme
    initTheme();
    updateThemeIcon();

    try {
        // Initialize Firebase
        await initializeFirebase();

        // Check if user is already authenticated
        await initAuth();

        // If already logged in, redirect to dashboard
        if (isAuthenticated()) {
            window.location.href = '../dashboard/dashboard.html';
            return;
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
    }

    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);

        // Password strength indicator
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', debounce(updatePasswordStrength, 200));
        }
    }

    // Forgot password form
    const forgotForm = document.getElementById('forgot-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', handleForgotPassword);
    }

    // Theme toggle
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
        btn.addEventListener('click', handleThemeToggle);
    });

    // Password visibility toggle
    document.querySelectorAll('[data-action="toggle-password"]').forEach(btn => {
        btn.addEventListener('click', handlePasswordToggle);
    });

    // Forgot password link
    const forgotLink = document.querySelector('[data-action="forgot-password"]');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('forgot-modal');
        });
    }

    // Modal close
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeModal('forgot-modal'));
    });

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('forgot-modal');
        }
    });

    // Clear errors on input
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('input', () => {
            const errorEl = document.getElementById(`${input.name}-error`);
            if (errorEl) {
                errorEl.textContent = '';
                errorEl.style.display = 'none';
            }
            input.classList.remove('error');
        });
    });
}

/**
 * Handle login form submission
 * @param {Event} event - Form submit event
 */
async function handleLogin(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email').trim();
    const password = formData.get('password');

    // Validate form
    const validation = validateForm(
        { email, password },
        {
            email: [
                { required: true, message: 'Email is required' },
                { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email' }
            ],
            password: [
                { required: true, message: 'Password is required' }
            ]
        }
    );

    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }

    // Show loading state
    setButtonLoading('login-btn', true);

    try {
        await signIn(email, password);

        // Redirect to dashboard
        showSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1000);
    } catch (error) {
        handleError(error, 'Login');
    } finally {
        setButtonLoading('login-btn', false);
    }
}

/**
 * Handle registration form submission
 * @param {Event} event - Form submit event
 */
async function handleRegister(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const userData = {
        firstName: formData.get('firstName').trim(),
        lastName: formData.get('lastName').trim(),
        email: formData.get('email').trim(),
        phone: formData.get('phone').trim(),
        password: formData.get('password'),
        confirmPassword: formData.get('confirmPassword'),
        terms: formData.get('terms')
    };

    // Validate form
    const validation = validateForm(
        userData,
        {
            firstName: [
                { required: true, message: 'First name is required' },
                { minLength: 2, message: 'First name must be at least 2 characters' }
            ],
            lastName: [
                { required: true, message: 'Last name is required' },
                { minLength: 2, message: 'Last name must be at least 2 characters' }
            ],
            email: [
                { required: true, message: 'Email is required' },
                { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Please enter a valid email' }
            ],
            password: [
                { required: true, message: 'Password is required' },
                {
                    validator: (value) => {
                        const result = validatePassword(value);
                        return result.isValid ? true : result.message;
                    }
                }
            ],
            confirmPassword: [
                { required: true, message: 'Please confirm your password' },
                {
                    validator: (value, fields) => {
                        return value === fields.password ? true : 'Passwords do not match';
                    }
                }
            ],
            terms: [
                {
                    validator: (value) => value ? true : 'You must accept the terms and conditions'
                }
            ]
        }
    );

    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }

    // Show loading state
    setButtonLoading('register-btn', true);

    try {
        await registerUser(userData.email, userData.password, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: `${userData.firstName} ${userData.lastName}`,
            phone: userData.phone
        });

        showSuccessMessage('Account created successfully! Redirecting...');
        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 1000);
    } catch (error) {
        handleError(error, 'Registration');
    } finally {
        setButtonLoading('register-btn', false);
    }
}

/**
 * Handle forgot password form submission
 * @param {Event} event - Form submit event
 */
async function handleForgotPassword(event) {
    event.preventDefault();

    const form = event.target;
    const email = form.querySelector('input[name="email"]').value.trim();

    if (!isValidEmail(email)) {
        const errorEl = document.getElementById('forgot-email-error');
        if (errorEl) {
            errorEl.textContent = 'Please enter a valid email address';
            errorEl.style.display = 'block';
        }
        return;
    }

    try {
        await resetPassword(email);
        showSuccessMessage('Password reset email sent! Check your inbox.');
        closeModal('forgot-modal');
        form.reset();
    } catch (error) {
        handleError(error, 'Password Reset');
    }
}

/**
 * Handle theme toggle
 * @param {Event} event - Click event
 */
function handleThemeToggle(event) {
    event.preventDefault();
    toggleTheme();
    updateThemeIcon();
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon() {
    const isDark = document.body.classList.contains('theme-dark');
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.textContent = isDark ? '☀️' : '🌙';
    });
}

/**
 * Handle password visibility toggle
 * @param {Event} event - Click event
 */
function handlePasswordToggle(event) {
    const button = event.currentTarget;
    const wrapper = button.closest('.password-input-wrapper');
    const input = wrapper.querySelector('input');
    const icon = button.querySelector('.eye-icon');

    if (input.type === 'password') {
        input.type = 'text';
        icon.textContent = '🙈';
    } else {
        input.type = 'password';
        icon.textContent = '👁️';
    }
}

/**
 * Update password strength indicator
 * @param {Event} event - Input event
 */
function updatePasswordStrength(event) {
    const password = event.target.value;
    const strengthEl = document.getElementById('password-strength');

    if (!strengthEl) return;

    const bar = strengthEl.querySelector('.strength-bar');
    const text = strengthEl.querySelector('.strength-text');

    // Calculate strength
    let strength = 0;
    let label = 'Weak';
    let color = '#ef4444';

    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

    if (strength >= 75) {
        label = 'Strong';
        color = '#10b981';
    } else if (strength >= 50) {
        label = 'Medium';
        color = '#f59e0b';
    }

    if (password.length === 0) {
        strengthEl.style.display = 'none';
    } else {
        strengthEl.style.display = 'flex';
        bar.style.width = `${Math.min(strength, 100)}%`;
        bar.style.backgroundColor = color;
        text.textContent = label;
        text.style.color = color;
    }
}

/**
 * Set button loading state
 * @param {string} buttonId - Button element ID
 * @param {boolean} isLoading - Whether to show loading state
 */
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    if (isLoading) {
        button.disabled = true;
        if (btnText) btnText.classList.add('hidden');
        if (btnLoader) btnLoader.classList.remove('hidden');
    } else {
        button.disabled = false;
        if (btnText) btnText.classList.remove('hidden');
        if (btnLoader) btnLoader.classList.add('hidden');
    }
}

/**
 * Open modal
 * @param {string} modalId - Modal element ID
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const active = document.activeElement;
        if (active && active instanceof HTMLElement) {
            modalReturnFocus.set(modalId, active);
        }

        if (!modal.dataset.dialogInit) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) closeModal(modalId);
            });
            modal.addEventListener('cancel', (e) => {
                e.preventDefault();
                closeModal(modalId);
            });
            modal.dataset.dialogInit = '1';
        }

        if (typeof modal.showModal === 'function') {
            if (!modal.open) modal.showModal();
        } else {
            modal.setAttribute('open', '');
        }
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Close modal
 * @param {string} modalId - Modal element ID
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const active = document.activeElement;
        if (active && active instanceof HTMLElement && modal.contains(active)) {
            active.blur();

            const returnEl = modalReturnFocus.get(modalId);
            if (returnEl && returnEl.isConnected && typeof returnEl.focus === 'function') {
                returnEl.focus();
            }
        }

        if (typeof modal.close === 'function') {
            if (modal.open) modal.close();
        } else {
            modal.removeAttribute('open');
        }
        document.body.style.overflow = '';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initAuthPage);
