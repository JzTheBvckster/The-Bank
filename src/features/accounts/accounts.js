"use strict";

/**
 * Accounts Feature Module
 * Handles account management and display
 * @module features/accounts/accounts
 */

import { initAuth, signOut, getCurrentUser, isAuthenticated, isAdmin, onAuthStateChange } from '../../core/auth.js';
import { initializeFirebase } from '../../core/firebase.js';
import { getUserAccounts, createAccount, getAccountTransactions } from '../../core/api.js';
import { handleError, validateForm, displayFormErrors, showSuccessMessage } from '../../core/errorHandler.js';
import { initTheme, toggleTheme, formatCurrency, formatDate, maskAccountNumber, createElement, copyToClipboard, showToast } from '../../core/utils.js';

// State
let userAccounts = [];

/**
 * Initialize accounts page
 */
async function initAccountsPage() {
    initTheme();
    updateThemeIcon();

    try {
        await initializeFirebase();
        await initAuth();

        onAuthStateChange(handleAuthStateChange);

        if (!isAuthenticated()) {
            window.location.href = '../auth/login.html';
            return;
        }

        await loadAccountsData();

    } catch (error) {
        handleError(error, 'Accounts Initialization');
    }

    setupEventListeners();
}

/**
 * Handle auth state changes
 */
function handleAuthStateChange(user) {
    if (!user) {
        window.location.href = '../auth/login.html';
        return;
    }

    if (isAdmin()) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // New account button
    document.querySelectorAll('[data-action="new-account"]').forEach(btn => {
        btn.addEventListener('click', () => openModal('new-account-modal'));
    });

    // New account form
    const newAccountForm = document.getElementById('new-account-form');
    if (newAccountForm) {
        newAccountForm.addEventListener('submit', handleCreateAccount);
    }

    // Account type change
    const accountTypeSelect = document.getElementById('accountType');
    if (accountTypeSelect) {
        accountTypeSelect.addEventListener('change', updateAccountTypeInfo);
    }

    // Theme toggle
    document.querySelectorAll('[data-action="toggle-theme"]').forEach(btn => {
        btn.addEventListener('click', handleThemeToggle);
    });

    // Menu toggle
    document.querySelectorAll('[data-action="toggle-menu"]').forEach(btn => {
        btn.addEventListener('click', handleMenuToggle);
    });

    // Logout
    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });

    // Modal close
    document.querySelectorAll('[data-action="close-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeModal('new-account-modal'));
    });

    document.querySelectorAll('[data-action="close-details-modal"]').forEach(btn => {
        btn.addEventListener('click', () => closeModal('account-details-modal'));
    });

    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal('new-account-modal');
            closeModal('account-details-modal');
        }
    });
}

/**
 * Load accounts data
 */
async function loadAccountsData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    try {
        userAccounts = await getUserAccounts(user.uid);
        renderAccounts();
        updateTotalBalance();
    } catch (error) {
        handleError(error, 'Loading Accounts');
    }
}

/**
 * Render accounts grid
 */
function renderAccounts() {
    const container = document.getElementById('accounts-grid');
    if (!container) return;

    container.innerHTML = '';

    if (!userAccounts || userAccounts.length === 0) {
        container.appendChild(
            createElement('div', { className: 'empty-state-large' }, [
                createElement('span', { className: 'empty-icon' }, '💳'),
                createElement('h3', {}, 'No Accounts Yet'),
                createElement('p', {}, 'Open your first account to start managing your finances'),
                createElement('button', {
                    className: 'btn btn-primary',
                    onclick: () => openModal('new-account-modal')
                }, 'Open Account')
            ])
        );
        return;
    }

    userAccounts.forEach(account => {
        const accountCard = createAccountCard(account);
        container.appendChild(accountCard);
    });
}

/**
 * Create account card element
 */
function createAccountCard(account) {
    const cardClass = `account-card ${account.accountType}`;

    const card = createElement('article', { className: cardClass }, [
        createElement('div', { className: 'account-card-header' }, [
            createElement('span', { className: 'account-icon' }, getAccountIcon(account.accountType)),
            createElement('span', { className: `account-status status-${account.status}` }, capitalizeFirst(account.status))
        ]),
        createElement('div', { className: 'account-card-type' }, capitalizeFirst(account.accountType) + ' Account'),
        createElement('div', { className: 'account-card-number' }, [
            createElement('span', {}, maskAccountNumber(account.accountNumber)),
            createElement('button', {
                className: 'copy-btn',
                title: 'Copy account number',
                onclick: (e) => {
                    e.stopPropagation();
                    handleCopyAccountNumber(account.accountNumber);
                }
            }, '📋')
        ]),
        createElement('div', { className: 'account-card-balance' }, [
            createElement('span', { className: 'balance-label' }, 'Available Balance'),
            createElement('span', { className: 'balance-value' }, formatCurrency(account.balance || 0, account.currency))
        ]),
        createElement('div', { className: 'account-card-actions' }, [
            createElement('button', {
                className: 'btn btn-sm btn-outline',
                onclick: () => showAccountDetails(account)
            }, 'Details'),
            createElement('a', {
                href: '../transfers/transfers.html',
                className: 'btn btn-sm btn-primary'
            }, 'Transfer')
        ])
    ]);

    return card;
}

/**
 * Get icon for account type
 */
function getAccountIcon(type) {
    const icons = {
        'checking': '💳',
        'savings': '🏦',
        'investment': '📈'
    };
    return icons[type] || '💰';
}

/**
 * Update total balance display
 */
function updateTotalBalance() {
    const totalEl = document.getElementById('total-balance');
    if (!totalEl) return;

    const total = userAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    totalEl.textContent = formatCurrency(total);
}

/**
 * Handle create account form submission
 */
async function handleCreateAccount(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const accountData = {
        accountType: formData.get('accountType'),
        currency: formData.get('currency')
    };

    const validation = validateForm(
        accountData,
        {
            accountType: [
                { required: true, message: 'Please select an account type' }
            ]
        }
    );

    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }

    try {
        const user = getCurrentUser();
        await createAccount({
            ...accountData,
            userId: user.uid
        });

        showSuccessMessage('Account created successfully!');
        closeModal('new-account-modal');
        form.reset();
        await loadAccountsData();

    } catch (error) {
        handleError(error, 'Create Account');
    }
}

/**
 * Update account type info display
 */
function updateAccountTypeInfo() {
    const select = document.getElementById('accountType');
    const infoEl = document.getElementById('account-type-info');
    if (!select || !infoEl) return;

    const typeInfo = {
        'checking': {
            title: 'Checking Account',
            features: ['No minimum balance', 'Unlimited transactions', 'Debit card included', 'Online banking access']
        },
        'savings': {
            title: 'Savings Account',
            features: ['2.5% APY interest rate', 'No monthly fees', 'Auto-save features', 'Goal tracking']
        },
        'investment': {
            title: 'Investment Account',
            features: ['Access to stocks & ETFs', 'Professional portfolio tools', 'Tax-advantaged options', 'Expert guidance']
        }
    };

    const info = typeInfo[select.value];

    if (info) {
        infoEl.innerHTML = '';
        const list = createElement('ul', { className: 'account-features' });
        info.features.forEach(feature => {
            list.appendChild(createElement('li', {}, [
                createElement('span', { className: 'feature-check' }, '✓'),
                feature
            ]));
        });
        infoEl.appendChild(createElement('h4', {}, info.title));
        infoEl.appendChild(list);
    } else {
        infoEl.innerHTML = '<p>Select an account type to see details</p>';
    }
}

/**
 * Show account details modal
 */
async function showAccountDetails(account) {
    const content = document.getElementById('account-details-content');
    if (!content) return;

    // Show loading
    content.innerHTML = '<div class="loading-placeholder"><div class="spinner"></div></div>';
    openModal('account-details-modal');

    try {
        const transactions = await getAccountTransactions(account.id, 10);

        content.innerHTML = '';

        // Account info section
        const infoSection = createElement('div', { className: 'details-section' }, [
            createElement('h3', {}, 'Account Information'),
            createElement('div', { className: 'details-grid' }, [
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Account Type'),
                    createElement('span', { className: 'detail-value' }, capitalizeFirst(account.accountType))
                ]),
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Account Number'),
                    createElement('span', { className: 'detail-value' }, account.accountNumber)
                ]),
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Status'),
                    createElement('span', { className: `detail-value badge badge-${account.status === 'active' ? 'success' : 'warning'}` }, capitalizeFirst(account.status))
                ]),
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Currency'),
                    createElement('span', { className: 'detail-value' }, account.currency || 'USD')
                ]),
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Current Balance'),
                    createElement('span', { className: 'detail-value balance' }, formatCurrency(account.balance || 0))
                ]),
                createElement('div', { className: 'detail-item' }, [
                    createElement('span', { className: 'detail-label' }, 'Opened On'),
                    createElement('span', { className: 'detail-value' }, formatDate(account.createdAt))
                ])
            ])
        ]);

        content.appendChild(infoSection);

        // Recent transactions section
        const transSection = createElement('div', { className: 'details-section' }, [
            createElement('h3', {}, 'Recent Transactions')
        ]);

        if (transactions && transactions.length > 0) {
            const transList = createElement('div', { className: 'mini-transactions' });
            transactions.forEach(t => {
                const isCredit = t.type === 'credit';
                transList.appendChild(
                    createElement('div', { className: 'mini-transaction' }, [
                        createElement('span', { className: 'mini-trans-desc' }, t.description || 'Transaction'),
                        createElement('span', { className: `mini-trans-amount ${isCredit ? 'credit' : 'debit'}` },
                            `${isCredit ? '+' : '-'}${formatCurrency(t.amount)}`)
                    ])
                );
            });
            transSection.appendChild(transList);
        } else {
            transSection.appendChild(
                createElement('p', { className: 'text-muted' }, 'No recent transactions')
            );
        }

        content.appendChild(transSection);

    } catch (error) {
        content.innerHTML = '<p class="text-danger">Failed to load account details</p>';
    }
}

/**
 * Handle copy account number
 */
async function handleCopyAccountNumber(accountNumber) {
    const success = await copyToClipboard(accountNumber);
    if (success) {
        showToast('Account number copied!', 'success');
    }
}

// Utility functions
function handleThemeToggle(event) {
    event.preventDefault();
    toggleTheme();
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('theme-dark');
    document.querySelectorAll('.theme-icon').forEach(icon => {
        icon.textContent = isDark ? '☀️' : '🌙';
    });
}

function handleMenuToggle(event) {
    event.preventDefault();
    document.getElementById('sidebar')?.classList.toggle('active');
}

async function handleLogout(event) {
    event.preventDefault();
    try {
        await signOut();
        window.location.href = '../auth/login.html';
    } catch (error) {
        handleError(error, 'Logout');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

document.addEventListener('DOMContentLoaded', initAccountsPage);
