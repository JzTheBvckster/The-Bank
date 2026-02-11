"use strict";

/**
 * Loans Feature Module
 * Handles loan applications and management
 * @module features/loans/loans
 */

import { initAuth, signOut, getCurrentUser, isAuthenticated, isAdmin, onAuthStateChange } from '../../core/auth.js';
import { initializeFirebase } from '../../core/firebase.js';
import { getUserLoans, applyForLoan } from '../../core/api.js';
import { handleError, validateForm, displayFormErrors, showSuccessMessage } from '../../core/errorHandler.js';
import { initTheme, toggleTheme, formatCurrency, formatDate, createElement, createIcon, debounce } from '../../core/utils.js';

// Interest rates
const INTEREST_RATES = {
    'personal': 12.5,
    'home': 8.5,
    'auto': 9.5,
    'education': 7.5,
    'business': 11.0
};

// State
let userLoans = [];

// Track focus so we can restore it when closing modals
const modalReturnFocus = new Map();

/**
 * Initialize loans page
 */
async function initLoansPage() {
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

        await loadLoansData();

    } catch (error) {
        handleError(error, 'Loans Initialization');
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
    // Apply loan button
    document.querySelectorAll('[data-action="apply-loan"]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('loanType').value = '';
            openModal('loan-modal');
        });
    });

    // Select loan type from cards
    document.querySelectorAll('[data-action="select-loan"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const loanType = e.target.dataset.type;
            document.getElementById('loanType').value = loanType;
            openModal('loan-modal');
            calculateLoan();
        });
    });

    // Loan form
    const loanForm = document.getElementById('loan-form');
    if (loanForm) {
        loanForm.addEventListener('submit', handleLoanApplication);
    }

    // Loan calculator
    const amountInput = document.getElementById('amount');
    const termSelect = document.getElementById('term');
    const typeSelect = document.getElementById('loanType');

    if (amountInput) amountInput.addEventListener('input', debounce(calculateLoan, 200));
    if (termSelect) termSelect.addEventListener('change', calculateLoan);
    if (typeSelect) typeSelect.addEventListener('change', calculateLoan);

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
        btn.addEventListener('click', () => closeModal('loan-modal'));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal('loan-modal');
    });
}

/**
 * Load loans data
 */
async function loadLoansData() {
    const user = getCurrentUser();
    if (!user || !user.uid) return;

    try {
        userLoans = await getUserLoans(user.uid);
        renderLoans();
    } catch (error) {
        handleError(error, 'Loading Loans');
    }
}

/**
 * Render loans list
 */
function renderLoans() {
    const container = document.getElementById('loans-list');
    if (!container) return;

    container.innerHTML = '';

    if (!userLoans || userLoans.length === 0) {
        container.appendChild(
            createElement('div', { className: 'empty-state' }, [
                createElement('span', { className: 'empty-icon' }, createIcon('document')),
                createElement('p', {}, 'No loan applications yet'),
                createElement('p', { className: 'text-muted' }, 'Apply for a loan to get started')
            ])
        );
        return;
    }

    userLoans.forEach(loan => {
        const loanCard = createLoanCard(loan);
        container.appendChild(loanCard);
    });
}

/**
 * Create loan card element
 */
function createLoanCard(loan) {
    const statusColors = {
        'pending': 'warning',
        'approved': 'success',
        'rejected': 'danger',
        'active': 'primary'
    };

    const loanIcons = {
        personal: () => createIcon('money'),
        home: () => createIcon('home'),
        auto: () => createIcon('car'),
        education: () => createIcon('graduation'),
        business: () => createIcon('briefcase')
    };

    const monthlyPayment = calculateMonthlyPayment(loan.amount, loan.interestRate, loan.term);

    const card = createElement('article', { className: 'loan-card' }, [
        createElement('div', { className: 'loan-card-header' }, [
            createElement('div', { className: 'loan-type-info' }, [
                createElement('span', { className: 'loan-icon' }, (loanIcons[loan.loanType] ? loanIcons[loan.loanType]() : createIcon('document'))),
                createElement('div', {}, [
                    createElement('h4', {}, capitalizeFirst(loan.loanType) + ' Loan'),
                    createElement('span', { className: 'loan-date' }, `Applied: ${formatDate(loan.createdAt)}`)
                ])
            ]),
            createElement('span', { className: `badge badge-${statusColors[loan.status]}` }, capitalizeFirst(loan.status))
        ]),
        createElement('div', { className: 'loan-card-body' }, [
            createElement('div', { className: 'loan-details-grid' }, [
                createElement('div', { className: 'loan-detail' }, [
                    createElement('span', { className: 'detail-label' }, 'Loan Amount'),
                    createElement('span', { className: 'detail-value' }, formatCurrency(loan.amount))
                ]),
                createElement('div', { className: 'loan-detail' }, [
                    createElement('span', { className: 'detail-label' }, 'Interest Rate'),
                    createElement('span', { className: 'detail-value' }, `${loan.interestRate}% APR`)
                ]),
                createElement('div', { className: 'loan-detail' }, [
                    createElement('span', { className: 'detail-label' }, 'Term'),
                    createElement('span', { className: 'detail-value' }, `${loan.term} months`)
                ]),
                createElement('div', { className: 'loan-detail' }, [
                    createElement('span', { className: 'detail-label' }, 'Monthly Payment'),
                    createElement('span', { className: 'detail-value monthly' }, formatCurrency(monthlyPayment))
                ])
            ])
        ]),
        loan.adminNote ? createElement('div', { className: 'loan-card-footer' }, [
            createElement('p', { className: 'admin-note' }, [
                createElement('strong', {}, 'Note: '),
                loan.adminNote
            ])
        ]) : null
    ].filter(Boolean));

    return card;
}

/**
 * Handle loan application form submission
 */
async function handleLoanApplication(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    const loanData = {
        loanType: formData.get('loanType'),
        amount: parseFloat(formData.get('amount')),
        term: parseInt(formData.get('term')),
        purpose: formData.get('purpose').trim()
    };

    const validation = validateForm(
        loanData,
        {
            loanType: [
                { required: true, message: 'Please select a loan type' }
            ],
            amount: [
                { required: true, message: 'Please enter loan amount' },
                {
                    validator: (value) => {
                        if (value < 1000) return 'Minimum loan amount is $1,000';
                        if (value > 500000) return 'Maximum loan amount is $500,000';
                        return true;
                    }
                }
            ],
            term: [
                { required: true, message: 'Please select a loan term' }
            ],
            purpose: [
                { required: true, message: 'Please describe the purpose of the loan' },
                { minLength: 10, message: 'Please provide more details (at least 10 characters)' }
            ]
        }
    );

    if (!validation.isValid) {
        displayFormErrors(validation.errors);
        return;
    }

    try {
        const user = getCurrentUser();
        await applyForLoan({
            ...loanData,
            userId: user.uid
        });

        showSuccessMessage('Loan application submitted successfully!');
        closeModal('loan-modal');
        form.reset();
        await loadLoansData();

    } catch (error) {
        handleError(error, 'Loan Application');
    }
}

/**
 * Calculate and display loan estimates
 */
function calculateLoan() {
    const amount = parseFloat(document.getElementById('amount')?.value) || 0;
    const term = parseInt(document.getElementById('term')?.value) || 0;
    const loanType = document.getElementById('loanType')?.value || 'personal';

    const rate = INTEREST_RATES[loanType] || 12.5;

    if (amount > 0 && term > 0) {
        const monthlyPayment = calculateMonthlyPayment(amount, rate, term);
        const totalAmount = monthlyPayment * term;
        const totalInterest = totalAmount - amount;

        document.getElementById('monthly-payment').textContent = formatCurrency(monthlyPayment);
        document.getElementById('total-interest').textContent = formatCurrency(totalInterest);
        document.getElementById('total-amount').textContent = formatCurrency(totalAmount);
    } else {
        document.getElementById('monthly-payment').textContent = '$0.00';
        document.getElementById('total-interest').textContent = '$0.00';
        document.getElementById('total-amount').textContent = '$0.00';
    }
}

/**
 * Calculate monthly payment
 */
function calculateMonthlyPayment(principal, annualRate, termMonths) {
    const monthlyRate = annualRate / 100 / 12;

    if (monthlyRate === 0) {
        return principal / termMonths;
    }

    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1);

    return Math.round(payment * 100) / 100;
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
        icon.replaceChildren(createIcon(isDark ? 'sun' : 'moon'));
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
        calculateLoan();

        const focusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable && typeof focusable.focus === 'function') {
            setTimeout(() => focusable.focus(), 0);
        }
    }
}

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

function capitalizeFirst(str) {
    return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
}

document.addEventListener('DOMContentLoaded', initLoansPage);
