"use strict";

/**
 * Dashboard Feature Module
 * Handles dashboard data display and interactions
 * @module features/dashboard/dashboard
 */

import { initAuth, signOut, getCurrentUser, isAuthenticated, isAdmin, onAuthStateChange } from '../../core/auth.js';
import { initializeFirebase } from '../../core/firebase.js';
import { getDashboardStats, getUserAccounts, getUserTransactions } from '../../core/api.js';
import { handleError, showSuccessMessage } from '../../core/errorHandler.js';
import { initTheme, toggleTheme, formatCurrency, formatRelativeTime, maskAccountNumber, createElement, createIcon } from '../../core/utils.js';

/**
 * Initialize dashboard page
 */
async function initDashboard() {
    // Initialize theme
    initTheme();
    updateThemeIcon();

    try {
        // Initialize Firebase and Auth
        await initializeFirebase();
        await initAuth();

        // Setup auth state listener
        onAuthStateChange(handleAuthStateChange);

        // Check authentication
        if (!isAuthenticated()) {
            window.location.href = '../auth/login.html';
            return;
        }

        // Load dashboard data
        await loadDashboardData();

    } catch (error) {
        handleError(error, 'Dashboard Initialization');
    }

    // Setup event listeners
    setupEventListeners();

    // Set current date
    setCurrentDate();
}

/**
 * Handle auth state changes
 * @param {Object|null} user - Current user or null
 */
function handleAuthStateChange(user) {
    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

    // Update UI with user info
    updateUserInfo(user);

    // Show admin link if user is admin
    if (isAdmin()) {
        document.querySelectorAll('.admin-only').forEach(el => {
            el.classList.remove('hidden');
        });
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Theme toggle
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
        btn.addEventListener('click', handleThemeToggle);
    });

    // Menu toggle (mobile)
    document.querySelectorAll('[data-action="toggle-menu"]').forEach(btn => {
        btn.addEventListener('click', handleMenuToggle);
    });

    // User menu toggle
    document.querySelectorAll('[data-action="toggle-user-menu"]').forEach(btn => {
        btn.addEventListener('click', handleUserMenuToggle);
    });

    // Logout
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    // Close user dropdown on outside click
    document.addEventListener('click', (e) => {
        const userMenu = document.querySelector('.user-menu');
        const dropdown = document.getElementById('user-dropdown');

        if (userMenu && dropdown && !userMenu.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    try {
        // Get dashboard statistics
        const stats = await getDashboardStats(user.uid);

        // Update stats cards
        updateStatsCards(stats);

        // Load accounts
        const accounts = await getUserAccounts(user.uid);
        renderAccounts(accounts);

        // Load recent transactions
        const transactions = await getUserTransactions(user.uid, 5);
        renderTransactions(transactions);

    } catch (error) {
        handleError(error, 'Loading Dashboard Data');
    }
}

/**
 * Update user info in UI
 * @param {Object} user - User object
 */
function updateUserInfo(user) {
    const userName = document.getElementById('user-name');
    const welcomeName = document.getElementById('welcome-name');

    const displayName = user.displayName || user.firstName || user.email?.split('@')[0] || 'User';

    if (userName) {
        userName.textContent = displayName;
    }

    if (welcomeName) {
        welcomeName.textContent = displayName.split(' ')[0];
    }
}

/**
 * Update stats cards with data
 * @param {Object} stats - Dashboard statistics
 */
function updateStatsCards(stats) {
    const totalBalance = document.getElementById('total-balance');
    const monthlyIncome = document.getElementById('monthly-income');
    const monthlyExpenses = document.getElementById('monthly-expenses');
    const activeLoans = document.getElementById('active-loans');
    const totalDebt = document.getElementById('total-debt');

    if (totalBalance) {
        totalBalance.textContent = formatCurrency(stats.totalBalance || 0);
    }

    if (monthlyIncome) {
        monthlyIncome.textContent = formatCurrency(stats.monthlyIncome || 0);
    }

    if (monthlyExpenses) {
        monthlyExpenses.textContent = formatCurrency(stats.monthlyExpenses || 0);
    }

    if (activeLoans) {
        activeLoans.textContent = stats.activeLoans || 0;
    }

    if (totalDebt) {
        totalDebt.textContent = `${formatCurrency(stats.totalDebt || 0)} total debt`;
    }
}

/**
 * Render accounts list
 * @param {Array} accounts - Array of account objects
 */
function renderAccounts(accounts) {
    const container = document.getElementById('accounts-list');
    if (!container) return;

    container.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        container.appendChild(
            createElement('div', { className: 'empty-state' }, [
                createElement('p', {}, 'No accounts found'),
                createElement('a', { href: '../accounts/accounts.html', className: 'btn btn-primary btn-sm' }, 'Open Account')
            ])
        );
        return;
    }

    accounts.forEach(account => {
        const accountCard = createElement('div', {
            className: `account-mini-card ${account.accountType}`
        }, [
            createElement('div', { className: 'account-mini-header' }, [
                createElement('span', { className: 'account-type' }, capitalizeFirst(account.accountType)),
                createElement('span', { className: 'account-number' }, maskAccountNumber(account.accountNumber))
            ]),
            createElement('div', { className: 'account-mini-balance' }, formatCurrency(account.balance || 0)),
            createElement('div', { className: 'account-mini-status' }, [
                createElement('span', { className: `status-dot ${account.status}` }),
                createElement('span', {}, capitalizeFirst(account.status))
            ])
        ]);

        container.appendChild(accountCard);
    });
}

/**
 * Render transactions list
 * @param {Array} transactions - Array of transaction objects
 */
function renderTransactions(transactions) {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.appendChild(
            createElement('div', { className: 'empty-state' }, [
                createElement('p', {}, 'No transactions yet'),
                createElement('a', { href: '../transfers/transfers.html', className: 'btn btn-primary btn-sm' }, 'Make Transfer')
            ])
        );
        return;
    }

    transactions.forEach(transaction => {
        const isCredit = transaction.type === 'credit';
        const amountClass = isCredit ? 'credit' : 'debit';

        const transactionItem = createElement('div', { className: 'transaction-item' }, [
            createElement('div', { className: `transaction-icon ${amountClass}` }, createIcon(isCredit ? 'arrow-down' : 'arrow-up')),
            createElement('div', { className: 'transaction-details' }, [
                createElement('span', { className: 'transaction-title' }, transaction.description || 'Transaction'),
                createElement('span', { className: 'transaction-date' }, formatRelativeTime(transaction.createdAt))
            ]),
            createElement('div', { className: `transaction-amount ${amountClass}` },
                `${isCredit ? '+' : '-'}${formatCurrency(transaction.amount || 0)}`
            )
        ]);

        container.appendChild(transactionItem);
    });
}

/**
 * Set current date display
 */
function setCurrentDate() {
    const dateEl = document.getElementById('current-date');
    if (dateEl) {
        const options = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        dateEl.textContent = new Date().toLocaleDateString('en-US', options);
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
 * Update theme toggle icons
 */
function updateThemeIcon() {
    const isDark = document.body.classList.contains('theme-dark');
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.replaceChildren(createIcon(isDark ? 'sun' : 'moon'));
    });
}

/**
 * Handle mobile menu toggle
 * @param {Event} event - Click event
 */
function handleMenuToggle(event) {
    event.preventDefault();
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
    }
}

/**
 * Handle user menu toggle
 * @param {Event} event - Click event
 */
function handleUserMenuToggle(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

/**
 * Handle logout
 * @param {Event} event - Click event
 */
async function handleLogout(event) {
    event.preventDefault();

    try {
        await signOut();
        showSuccessMessage('Logged out successfully');
        window.location.href = '../auth/login.html';
    } catch (error) {
        handleError(error, 'Logout');
    }
}

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initDashboard);
