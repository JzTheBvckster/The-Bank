/**
 * Admin Panel Module
 * Handles admin functionality including loan approvals and user management
 */

import { onAuthChange, signOutUser, requireRole } from '../../core/auth.js';
import { getPendingLoans, updateLoanStatus, getAllUsers, getDashboardStats } from '../../core/api.js';
import { formatCurrency, formatDate, showToast, showLoading, hideLoading, createElement } from '../../core/utils.js';

// State
let currentUser = null;
let pendingLoans = [];
let allUsers = [];
let selectedLoan = null;

// Track focus so we can restore it when closing dialogs
const dialogReturnFocus = new Map();

function openDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    const active = document.activeElement;
    if (active && active instanceof HTMLElement) {
        dialogReturnFocus.set(dialogId, active);
    }

    if (!dialog.dataset.dialogInit) {
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) closeDialog(dialogId);
        });
        dialog.addEventListener('cancel', (e) => {
            e.preventDefault();
            closeDialog(dialogId);
        });
        dialog.dataset.dialogInit = '1';
    }

    if (typeof dialog.showModal === 'function') {
        if (!dialog.open) dialog.showModal();
    } else {
        dialog.setAttribute('open', '');
    }

    document.body.style.overflow = 'hidden';
}

function closeDialog(dialogId) {
    const dialog = document.getElementById(dialogId);
    if (!dialog) return;

    const active = document.activeElement;
    if (active && active instanceof HTMLElement && dialog.contains(active)) {
        active.blur();
    }

    if (typeof dialog.close === 'function') {
        if (dialog.open) dialog.close();
    } else {
        dialog.removeAttribute('open');
    }

    document.body.style.overflow = '';

    const returnEl = dialogReturnFocus.get(dialogId);
    if (returnEl && returnEl.isConnected && typeof returnEl.focus === 'function') {
        returnEl.focus();
    }
}

/**
 * Initialize Admin Panel
 */
async function initAdmin() {
    // Check authentication and role
    onAuthChange(async (user) => {
        if (user) {
            try {
                const hasAccess = await requireRole(['admin', 'employee']);
                if (!hasAccess) {
                    window.location.href = '../dashboard/dashboard.html';
                    return;
                }
                currentUser = user;
                document.getElementById('userName').textContent = user.displayName || 'Admin';
                await loadAdminData();
            } catch (error) {
                console.error('Access denied:', error);
                window.location.href = '../dashboard/dashboard.html';
            }
        } else {
            window.location.href = '../auth/login.html';
        }
    });

    setupEventListeners();
    setupTheme();
}

/**
 * Load all admin data
 */
async function loadAdminData() {
    showLoading();
    try {
        await Promise.all([
            loadStats(),
            loadPendingLoans(),
            loadUsers()
        ]);
    } catch (error) {
        console.error('Error loading admin data:', error);
        showToast('Failed to load admin data', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Load dashboard stats
 */
async function loadStats() {
    try {
        const stats = await getDashboardStats();
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('pendingLoans').textContent = stats.pendingLoans || 0;
        document.getElementById('approvedLoans').textContent = stats.approvedThisMonth || 0;
        document.getElementById('totalVolume').textContent = formatCurrency(stats.totalLoanVolume || 0);
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
 * Load pending loan applications
 */
async function loadPendingLoans() {
    try {
        pendingLoans = await getPendingLoans();
        renderLoanApplications();
    } catch (error) {
        console.error('Error loading pending loans:', error);
        pendingLoans = [];
        renderLoanApplications();
    }
}

/**
 * Load all users
 */
async function loadUsers() {
    try {
        allUsers = await getAllUsers();
        renderUsersTable();
    } catch (error) {
        console.error('Error loading users:', error);
        allUsers = [];
        renderUsersTable();
    }
}

/**
 * Render loan applications
 */
function renderLoanApplications(filterType = '') {
    const container = document.getElementById('loanApplications');
    const noLoansMessage = document.getElementById('noLoansMessage');

    let filteredLoans = pendingLoans;
    if (filterType) {
        filteredLoans = pendingLoans.filter(loan => loan.loanType === filterType);
    }

    container.innerHTML = '';

    if (filteredLoans.length === 0) {
        noLoansMessage.style.display = 'block';
        return;
    }

    noLoansMessage.style.display = 'none';

    const loanTypeIcons = {
        personal: '👤',
        mortgage: '🏠',
        auto: '🚗',
        business: '💼'
    };

    filteredLoans.forEach(loan => {
        const loanCard = createElement('div', { className: 'loan-application-card' });

        const loanHeader = createElement('div', { className: 'loan-app-header' });

        const loanInfo = createElement('div', { className: 'loan-app-info' });
        loanInfo.appendChild(createElement('span', { className: 'loan-app-icon', textContent: loanTypeIcons[loan.loanType] || '📋' }));

        const loanDetails = createElement('div', { className: 'loan-app-details' });
        loanDetails.appendChild(createElement('h4', { textContent: `${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)} Loan` }));
        loanDetails.appendChild(createElement('p', { textContent: `Applied: ${formatDate(loan.createdAt)}` }));
        loanInfo.appendChild(loanDetails);

        const loanAmount = createElement('div', { className: 'loan-app-amount' });
        loanAmount.appendChild(createElement('span', { className: 'amount', textContent: formatCurrency(loan.amount) }));
        loanAmount.appendChild(createElement('span', { className: 'term', textContent: `${loan.termMonths} months` }));

        loanHeader.appendChild(loanInfo);
        loanHeader.appendChild(loanAmount);

        const loanApplicant = createElement('div', { className: 'loan-applicant' });
        loanApplicant.appendChild(createElement('span', { textContent: `Applicant: ${loan.userName || 'Unknown'}` }));
        loanApplicant.appendChild(createElement('span', { textContent: `Purpose: ${loan.purpose || 'Not specified'}` }));

        const loanActions = createElement('div', { className: 'loan-app-actions' });

        const reviewBtn = createElement('button', {
            className: 'btn btn-outline btn-sm',
            textContent: 'Review'
        });
        reviewBtn.onclick = () => openLoanReview(loan);

        const quickApproveBtn = createElement('button', {
            className: 'btn btn-primary btn-sm',
            textContent: 'Quick Approve'
        });
        quickApproveBtn.onclick = () => approveLoan(loan.id);

        const quickRejectBtn = createElement('button', {
            className: 'btn btn-danger btn-sm',
            textContent: 'Reject'
        });
        quickRejectBtn.onclick = () => rejectLoan(loan.id);

        loanActions.appendChild(reviewBtn);
        loanActions.appendChild(quickApproveBtn);
        loanActions.appendChild(quickRejectBtn);

        loanCard.appendChild(loanHeader);
        loanCard.appendChild(loanApplicant);
        loanCard.appendChild(loanActions);

        container.appendChild(loanCard);
    });
}

/**
 * Render users table
 */
function renderUsersTable(searchTerm = '') {
    const tbody = document.getElementById('usersTableBody');

    let filteredUsers = allUsers;
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredUsers = allUsers.filter(user =>
            user.name?.toLowerCase().includes(term) ||
            user.email?.toLowerCase().includes(term)
        );
    }

    tbody.innerHTML = '';

    if (filteredUsers.length === 0) {
        const emptyRow = createElement('tr');
        const emptyCell = createElement('td', {
            colSpan: 6,
            textContent: 'No users found',
            style: 'text-align: center; padding: 2rem;'
        });
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }

    const roleColors = {
        admin: 'danger',
        employee: 'warning',
        customer: 'primary'
    };

    filteredUsers.forEach(user => {
        const row = createElement('tr');

        // User column
        const userCell = createElement('td');
        const userInfo = createElement('div', { className: 'user-info' });
        userInfo.appendChild(createElement('span', { className: 'user-avatar-sm', textContent: '👤' }));
        userInfo.appendChild(createElement('span', { textContent: user.name || 'Unknown' }));
        userCell.appendChild(userInfo);

        // Email column
        const emailCell = createElement('td', { textContent: user.email || 'N/A' });

        // Role column
        const roleCell = createElement('td');
        const roleBadge = createElement('span', {
            className: `badge badge-${roleColors[user.role] || 'primary'}`,
            textContent: user.role || 'customer'
        });
        roleCell.appendChild(roleBadge);

        // Joined column
        const joinedCell = createElement('td', {
            textContent: user.createdAt ? formatDate(user.createdAt) : 'N/A'
        });

        // Status column
        const statusCell = createElement('td');
        const statusBadge = createElement('span', {
            className: `badge badge-${user.status === 'active' ? 'success' : 'danger'}`,
            textContent: user.status || 'active'
        });
        statusCell.appendChild(statusBadge);

        // Actions column
        const actionsCell = createElement('td');
        const actionsDiv = createElement('div', { className: 'table-actions' });

        const editBtn = createElement('button', {
            className: 'btn btn-outline btn-sm',
            textContent: '✏️'
        });
        editBtn.onclick = () => openEditUser(user);

        actionsDiv.appendChild(editBtn);
        actionsCell.appendChild(actionsDiv);

        row.appendChild(userCell);
        row.appendChild(emailCell);
        row.appendChild(roleCell);
        row.appendChild(joinedCell);
        row.appendChild(statusCell);
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

/**
 * Open loan review modal
 */
function openLoanReview(loan) {
    selectedLoan = loan;
    const modal = document.getElementById('loanReviewModal');
    const content = document.getElementById('loanReviewContent');

    const loanTypeIcons = {
        personal: '👤',
        mortgage: '🏠',
        auto: '🚗',
        business: '💼'
    };

    content.innerHTML = '';

    const reviewGrid = createElement('div', { className: 'loan-review-grid' });

    // Loan Info Section
    const loanInfoSection = createElement('div', { className: 'review-section' });
    loanInfoSection.appendChild(createElement('h4', { textContent: 'Loan Information' }));

    const loanInfoGrid = createElement('div', { className: 'info-grid' });

    const addInfoItem = (label, value) => {
        const item = createElement('div', { className: 'info-item' });
        item.appendChild(createElement('span', { className: 'info-label', textContent: label }));
        item.appendChild(createElement('span', { className: 'info-value', textContent: value }));
        return item;
    };

    loanInfoGrid.appendChild(addInfoItem('Loan Type', `${loanTypeIcons[loan.loanType] || '📋'} ${loan.loanType.charAt(0).toUpperCase() + loan.loanType.slice(1)}`));
    loanInfoGrid.appendChild(addInfoItem('Amount', formatCurrency(loan.amount)));
    loanInfoGrid.appendChild(addInfoItem('Term', `${loan.termMonths} months`));
    loanInfoGrid.appendChild(addInfoItem('Interest Rate', `${loan.interestRate}%`));
    loanInfoGrid.appendChild(addInfoItem('Monthly Payment', formatCurrency(loan.monthlyPayment)));
    loanInfoGrid.appendChild(addInfoItem('Total Repayment', formatCurrency(loan.monthlyPayment * loan.termMonths)));

    loanInfoSection.appendChild(loanInfoGrid);

    // Applicant Info Section
    const applicantSection = createElement('div', { className: 'review-section' });
    applicantSection.appendChild(createElement('h4', { textContent: 'Applicant Information' }));

    const applicantGrid = createElement('div', { className: 'info-grid' });
    applicantGrid.appendChild(addInfoItem('Name', loan.userName || 'Unknown'));
    applicantGrid.appendChild(addInfoItem('Email', loan.userEmail || 'N/A'));
    applicantGrid.appendChild(addInfoItem('Applied On', formatDate(loan.createdAt)));
    applicantGrid.appendChild(addInfoItem('Purpose', loan.purpose || 'Not specified'));

    applicantSection.appendChild(applicantGrid);

    reviewGrid.appendChild(loanInfoSection);
    reviewGrid.appendChild(applicantSection);
    content.appendChild(reviewGrid);

    // Notes Section
    const notesSection = createElement('div', { className: 'review-section' });
    notesSection.appendChild(createElement('h4', { textContent: 'Admin Notes' }));
    const notesTextarea = createElement('textarea', {
        id: 'adminNotes',
        className: 'form-input',
        placeholder: 'Add notes about this application...',
        rows: 3
    });
    notesSection.appendChild(notesTextarea);
    content.appendChild(notesSection);

    openDialog('loanReviewModal');
}

/**
 * Open edit user modal
 */
function openEditUser(user) {
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name || '';
    document.getElementById('editUserEmail').value = user.email || '';
    document.getElementById('editUserRole').value = user.role || 'customer';
    document.getElementById('editUserStatus').value = user.status || 'active';

    openDialog('editUserModal');
}

/**
 * Approve loan
 */
async function approveLoan(loanId) {
    showLoading();
    try {
        const notes = document.getElementById('adminNotes')?.value || '';
        await updateLoanStatus(loanId, 'approved', notes);
        showToast('Loan approved successfully', 'success');
        closeModals();
        await loadPendingLoans();
        await loadStats();
    } catch (error) {
        console.error('Error approving loan:', error);
        showToast('Failed to approve loan', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Reject loan
 */
async function rejectLoan(loanId) {
    showLoading();
    try {
        const notes = document.getElementById('adminNotes')?.value || '';
        await updateLoanStatus(loanId, 'rejected', notes);
        showToast('Loan rejected', 'success');
        closeModals();
        await loadPendingLoans();
        await loadStats();
    } catch (error) {
        console.error('Error rejecting loan:', error);
        showToast('Failed to reject loan', 'error');
    } finally {
        hideLoading();
    }
}

/**
 * Close all modals
 */
function closeModals() {
    closeDialog('loanReviewModal');
    closeDialog('editUserModal');
    selectedLoan = null;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
        try {
            await signOutUser();
            window.location.href = '../auth/login.html';
        } catch (error) {
            showToast('Failed to logout', 'error');
        }
    });

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            const tabId = btn.dataset.tab;
            document.getElementById(`${tabId}-tab`)?.classList.add('active');
        });
    });

    // Loan type filter
    document.getElementById('loanTypeFilter')?.addEventListener('change', (e) => {
        renderLoanApplications(e.target.value);
    });

    // User search
    document.getElementById('userSearch')?.addEventListener('input', (e) => {
        renderUsersTable(e.target.value);
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-dismiss="modal"]').forEach(btn => {
        btn.addEventListener('click', closeModals);
    });

    // Loan review modal actions
    document.getElementById('approveLoanBtn')?.addEventListener('click', () => {
        if (selectedLoan) {
            approveLoan(selectedLoan.id);
        }
    });

    document.getElementById('rejectLoanBtn')?.addEventListener('click', () => {
        if (selectedLoan) {
            rejectLoan(selectedLoan.id);
        }
    });

    // Edit user form
    document.getElementById('editUserForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        // TODO: Implement user update
        showToast('User updated successfully', 'success');
        closeModals();
        await loadUsers();
    });

    // Mobile menu toggle
    document.getElementById('menuToggle')?.addEventListener('click', () => {
        document.getElementById('sidebar')?.classList.toggle('active');
    });
}

/**
 * Setup theme
 */
function setupTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';

    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle?.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initAdmin);
