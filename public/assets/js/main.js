"use strict";

/**
 * Main JavaScript Module for SecureBank Application
 * Handles global functionality, theme switching, and initialization
 * @module main
 */

import { initTheme, toggleTheme } from '/src/core/utils.js';

/**
 * Initialize the landing page
 */
function initLandingPage() {
    // Initialize theme from localStorage or system preference
    initTheme();

    // Setup event listeners
    setupEventListeners();

    // Initialize smooth scroll
    initSmoothScroll();
}

/**
 * Setup global event listeners
 */
function setupEventListeners() {
    // Theme toggle button
    const themeToggle = document.querySelector('[data-action="toggle-theme"]');
    if (themeToggle) {
        themeToggle.addEventListener('click', handleThemeToggle);
    }

    // Mobile menu toggle (if exists)
    const menuToggle = document.querySelector('[data-action="toggle-menu"]');
    if (menuToggle) {
        menuToggle.addEventListener('click', handleMenuToggle);
    }
}

/**
 * Handle theme toggle click
 * @param {Event} event - Click event
 */
function handleThemeToggle(event) {
    event.preventDefault();
    const isDark = toggleTheme();
    updateThemeIcon(isDark);
}

/**
 * Update theme toggle icon based on current theme
 * @param {boolean} isDark - Whether dark theme is active
 */
function updateThemeIcon(isDark) {
    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

/**
 * Handle mobile menu toggle
 * @param {Event} event - Click event
 */
function handleMenuToggle(event) {
    event.preventDefault();
    const sidebar = document.querySelector('.app-sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Initialize smooth scroll for anchor links
 */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (event) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            event.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Check initial theme and update icon
 */
function checkInitialTheme() {
    const isDark = document.body.classList.contains('theme-dark');
    updateThemeIcon(isDark);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initLandingPage();
    checkInitialTheme();
});

// Export for potential use in other modules
export { handleThemeToggle, handleMenuToggle };
