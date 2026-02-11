"use strict";

/**
 * Transfers Feature Module
 * Handles money transfers and transaction history
 * @module features/transfers/transfers
 */

import { initAuth, signOut, getCurrentUser, isAuthenticated, isAdmin, onAuthStateChange } from '../../core/auth.js';
import { initializeFirebase } from '../../core/firebase.js';
import { getUserAccounts, getUserTransactions, createTransfer } from '../../core/api.js';
import { handleError, validateForm, displayFormErrors, clearFormErrors, showSuccessMessage } from '../../core/errorHandler.js';
import { initTheme, toggleTheme, formatCurrency, formatDateTime, maskAccountNumber, createElement, debounce } from '../../core/utils.js';

// State
let userAccounts = [];
let allTransactions = [];

/**
 * Initialize transfers page
 */
async function initTransfersPage() {
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

        await loadTransfersData();

    } catch (error) {
        handleError(error, 'Transfers Initialization');
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

    updateUserInfo(user);

    if (isAdmin()) {
        document.querySelectorAll('.admin-only').forEach(el => el.classList.remove('hidden'));
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Transfer form
    const transferForm = document.getElementById('transfer-form');
    if (transferForm) {
        transferForm.addEventListener('submit', handleTransfer);
    }

    // Filter
    const filterType = document.getElementById('filter-type');
    if (filterType) {
        filterType.addEventListener('change', handleFilterChange);
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
        btn.addEventListener('click', () => closeModal('success-modal'));
    });

    // Clear errors on input
    document.querySelectorAll('.form-input, .form-select').forEach(input => {
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
 * Load transfers page data
 */
async function loadTransfersData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    try {
        // Load user accounts
        userAccounts = await getUserAccounts(user.uid);
        populateAccountSelect();

        // Load transactions
        allTransactions = await getUserTransactions(user.uid, 50);
        renderTransactions(allTransactions);

    } catch (error) {
        handleError(error, 'Loading Transfers Data');
    }
}

/**
 * Populate account select dropdown
 */
function populateAccountSelect() {
    const select = document.getElementById('fromAccount');
    if (!select) return;

    // Clear existing options except first
    select.innerHTML = '<option value="">Select source account</option>';

    userAccounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = `${capitalizeFirst(account.accountType)} (${maskAccountNumber(account.accountNumber)}) - ${formatCurrency(account.balance)}`;
        option.dataset.balance = account.balance;
        select.appendChild(option);
    });
}

/**
 * Handle transfer form submission
 */
async function handleTransfer(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const transferData = {
        fromAccountId: formData.get('fromAccount'),
        toAccountId: formData.get('toAccount').trim(),
        amount: parseFloat(formData.get('amount')),
        description: formData.get('description').trim()
    };

    // Get selected account balance
    const selectedOption = document.querySelector(`#fromAccount option[value="${transferData.fromAccountId}"]`);
    const accountBalance = selectedOption ? parseFloat(selectedOption.dataset.balance) : 0;

    // Validate
    const validation = validateForm(
        transferData,
        {
            fromAccountId: [
                { required: true, message: 'Please select a source account' }
            ],
            toAccountId: [
                { required: true, message: 'Please enter destination account' },
                { minLength: 4, message: 'Invalid account number' }
            ],
            amount: [
                { required: true, message: 'Please enter an amount' },
                {
                    validator: (value) => {
                        if (isNaN(value) || value <= 0) {
                            return 'Please enter a valid amount';
                        }
                        if (value > accountBalance) {
                            return 'Insufficient balance';
                        }
                        return true;
                    }
                }
            ]
        }
    );

    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }

    // Prevent same account transfer
    if (transferData.fromAccountId === transferData.toAccountId) {
        displayFormErrors({ toAccountId: 'Cannot transfer to the same account' });
        return;
    }

    setButtonLoading('transfer-btn', true);

    try {
        const user = getCurrentUser();
        await createTransfer({
            ...transferData,
            userId: user.uid
        });

        // Show success modal
        document.getElementById('success-message').textContent =
            `Successfully transferred ${formatCurrency(transferData.amount)}`;
        openModal('success-modal');

        // Reset form and reload data
        form.reset();
        await loadTransfersData();

    } catch (error) {
        handleError(error, 'Transfer');
    } finally {
        setButtonLoading('transfer-btn', false);
    }
}

/**
 * Handle transaction filter change
 */
function handleFilterChange(event) {
    const filterValue = event.target.value;

    let filtered = allTransactions;
    if (filterValue !== 'all') {
        filtered = allTransactions.filter(t => t.type === filterValue);
    }

    renderTransactions(filtered);
}

/**
 * Render transactions list
 */
function renderTransactions(transactions) {
    const container = document.getElementById('transactions-list');
    if (!container) return;

    container.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        container.appendChild(
            createElement('div', { className: 'empty-state' }, [
                createElement('span', { className: 'empty-icon' }, '💸'),
                createElement('p', {}, 'No transactions found')
            ])
        );
        return;
    }

    transactions.forEach(transaction => {
        const isCredit = transaction.type === 'credit';
        const icon = isCredit ? '↓' : '↑';
        const amountClass = isCredit ? 'credit' : 'debit';

        const transactionItem = createElement('div', { className: 'transaction-item' }, [
            createElement('div', { className: `transaction-icon ${amountClass}` }, icon),
            createElement('div', { className: 'transaction-details' }, [
                createElement('span', { className: 'transaction-title' }, transaction.description || 'Transaction'),
                createElement('span', { className: 'transaction-meta' }, [
                    createElement('span', { className: 'transaction-category' }, capitalizeFirst(transaction.category || 'transfer')),
                    createElement('span', {}, ' • '),
                    createElement('span', { className: 'transaction-date' }, formatDateTime(transaction.createdAt))
                ])
            ]),
            createElement('div', { className: `transaction-amount ${amountClass}` },
                `${isCredit ? '+' : '-'}${formatCurrency(transaction.amount || 0)}`
            )
        ]);

        container.appendChild(transactionItem);
    });
}

/**
 * Update user info
 */
function updateUserInfo(user) {
    const userName = document.getElementById('user-name');
    const displayName = user.displayName || user.firstName || user.email?.split('@')[0] || 'User';
    if (userName) userName.textContent = displayName;
}

/**
 * Handle theme toggle
 */
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
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('active');
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

function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;

    const btnText = button.querySelector('.btn-text');
    const btnLoader = button.querySelector('.btn-loader');

    button.disabled = isLoading;
    if (btnText) btnText.classList.toggle('hidden', isLoading);
    if (btnLoader) btnLoader.classList.toggle('hidden', !isLoading);
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
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

document.addEventListener('DOMContentLoaded', initTransfersPage);
