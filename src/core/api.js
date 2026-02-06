"use strict";

/**
 * API Module for SecureBank Application
 * Handles all Firestore database operations
 * @module core/api
 */

import { getDbInstance } from './firebase.js';
import { handleError, ApiError } from './errorHandler.js';
import { sanitizeInput } from './utils.js';

/**
 * Get all accounts for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of account objects
 */
async function getUserAccounts(userId) {
    try {
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(collection(db, 'accounts'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch accounts', 'FETCH_ACCOUNTS_ERROR');
    }
}

/**
 * Get account by ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Account object
 */
async function getAccountById(accountId) {
    try {
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const accountDoc = await getDoc(doc(db, 'accounts', accountId));

        if (accountDoc.exists()) {
            return { id: accountDoc.id, ...accountDoc.data() };
        }

        return null;
    } catch (error) {
        throw new ApiError('Failed to fetch account', 'FETCH_ACCOUNT_ERROR');
    }
}

/**
 * Create a new account
 * @param {Object} accountData - Account data
 * @returns {Promise<Object>} Created account object
 */
async function createAccount(accountData) {
    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const sanitizedData = {
            userId: accountData.userId,
            accountType: sanitizeInput(accountData.accountType),
            accountNumber: generateAccountNumber(),
            balance: 0,
            currency: sanitizeInput(accountData.currency) || 'USD',
            status: 'active',
            createdAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'accounts'), sanitizedData);

        return { id: docRef.id, ...sanitizedData };
    } catch (error) {
        throw new ApiError('Failed to create account', 'CREATE_ACCOUNT_ERROR');
    }
}

/**
 * Get transactions for an account
 * @param {string} accountId - Account ID
 * @param {number} limit - Maximum number of transactions
 * @returns {Promise<Array>} Array of transaction objects
 */
async function getAccountTransactions(accountId, limit = 50) {
    try {
        const { collection, query, where, orderBy, limit: queryLimit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(
            collection(db, 'transactions'),
            where('accountId', '==', accountId),
            orderBy('createdAt', 'desc'),
            queryLimit(limit)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch transactions', 'FETCH_TRANSACTIONS_ERROR');
    }
}

/**
 * Get all transactions for a user (across all accounts)
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of transactions
 * @returns {Promise<Array>} Array of transaction objects
 */
async function getUserTransactions(userId, limit = 100) {
    try {
        const { collection, query, where, orderBy, limit: queryLimit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(
            collection(db, 'transactions'),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            queryLimit(limit)
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch user transactions', 'FETCH_USER_TRANSACTIONS_ERROR');
    }
}

/**
 * Create a transfer between accounts
 * @param {Object} transferData - Transfer data
 * @returns {Promise<Object>} Transfer result
 */
async function createTransfer(transferData) {
    try {
        const { doc, runTransaction, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const { fromAccountId, toAccountId, amount, description, userId } = transferData;
        const sanitizedDescription = sanitizeInput(description);

        // Use a transaction to ensure atomicity
        const result = await runTransaction(db, async (transaction) => {
            // Get source account
            const fromAccountRef = doc(db, 'accounts', fromAccountId);
            const fromAccountDoc = await transaction.get(fromAccountRef);

            if (!fromAccountDoc.exists()) {
                throw new Error('Source account not found');
            }

            const fromAccount = fromAccountDoc.data();

            // Check sufficient balance
            if (fromAccount.balance < amount) {
                throw new Error('Insufficient balance');
            }

            // Get destination account
            const toAccountRef = doc(db, 'accounts', toAccountId);
            const toAccountDoc = await transaction.get(toAccountRef);

            if (!toAccountDoc.exists()) {
                throw new Error('Destination account not found');
            }

            const toAccount = toAccountDoc.data();

            // Update balances
            transaction.update(fromAccountRef, {
                balance: fromAccount.balance - amount
            });

            transaction.update(toAccountRef, {
                balance: toAccount.balance + amount
            });

            // Create transaction records
            const timestamp = serverTimestamp();

            // Debit transaction
            const debitRef = doc(db, 'transactions', `${Date.now()}_debit`);
            transaction.set(debitRef, {
                userId: userId,
                accountId: fromAccountId,
                type: 'debit',
                category: 'transfer',
                amount: amount,
                description: sanitizedDescription || 'Transfer out',
                relatedAccountId: toAccountId,
                status: 'completed',
                createdAt: timestamp
            });

            // Credit transaction
            const creditRef = doc(db, 'transactions', `${Date.now()}_credit`);
            transaction.set(creditRef, {
                userId: toAccount.userId,
                accountId: toAccountId,
                type: 'credit',
                category: 'transfer',
                amount: amount,
                description: sanitizedDescription || 'Transfer in',
                relatedAccountId: fromAccountId,
                status: 'completed',
                createdAt: timestamp
            });

            return {
                success: true,
                newFromBalance: fromAccount.balance - amount,
                newToBalance: toAccount.balance + amount
            };
        });

        return result;
    } catch (error) {
        if (error.message === 'Insufficient balance') {
            throw new ApiError('Insufficient balance for this transfer', 'INSUFFICIENT_BALANCE');
        }
        if (error.message === 'Source account not found' || error.message === 'Destination account not found') {
            throw new ApiError(error.message, 'ACCOUNT_NOT_FOUND');
        }
        throw new ApiError('Transfer failed. Please try again.', 'TRANSFER_ERROR');
    }
}

/**
 * Get all loans for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of loan objects
 */
async function getUserLoans(userId) {
    try {
        const { collection, query, where, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(collection(db, 'loans'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch loans', 'FETCH_LOANS_ERROR');
    }
}

/**
 * Apply for a loan
 * @param {Object} loanData - Loan application data
 * @returns {Promise<Object>} Created loan application
 */
async function applyForLoan(loanData) {
    try {
        const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const sanitizedData = {
            userId: loanData.userId,
            loanType: sanitizeInput(loanData.loanType),
            amount: Number(loanData.amount),
            term: Number(loanData.term),
            interestRate: calculateInterestRate(loanData.loanType),
            purpose: sanitizeInput(loanData.purpose),
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'loans'), sanitizedData);

        return { id: docRef.id, ...sanitizedData };
    } catch (error) {
        throw new ApiError('Failed to submit loan application', 'LOAN_APPLICATION_ERROR');
    }
}

/**
 * Get all pending loan applications (admin)
 * @returns {Promise<Array>} Array of pending loan applications
 */
async function getPendingLoans() {
    try {
        const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(
            collection(db, 'loans'),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'asc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch pending loans', 'FETCH_PENDING_LOANS_ERROR');
    }
}

/**
 * Approve or reject a loan (admin)
 * @param {string} loanId - Loan ID
 * @param {string} status - New status ('approved' or 'rejected')
 * @param {string} adminNote - Admin note
 * @returns {Promise<void>}
 */
async function updateLoanStatus(loanId, status, adminNote = '') {
    try {
        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        await updateDoc(doc(db, 'loans', loanId), {
            status: status,
            adminNote: sanitizeInput(adminNote),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        throw new ApiError('Failed to update loan status', 'UPDATE_LOAN_STATUS_ERROR');
    }
}

/**
 * Get all users (admin)
 * @returns {Promise<Array>} Array of user objects
 */
async function getAllUsers() {
    try {
        const { collection, getDocs, orderBy, query } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        throw new ApiError('Failed to fetch users', 'FETCH_USERS_ERROR');
    }
}

/**
 * Update user role (admin)
 * @param {string} userId - User ID
 * @param {string} role - New role
 * @returns {Promise<void>}
 */
async function updateUserRole(userId, role) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        await updateDoc(doc(db, 'users', userId), {
            role: sanitizeInput(role),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        throw new ApiError('Failed to update user role', 'UPDATE_USER_ROLE_ERROR');
    }
}

/**
 * Update user status (admin)
 * @param {string} userId - User ID
 * @param {string} status - New status
 * @returns {Promise<void>}
 */
async function updateUserStatus(userId, status) {
    try {
        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        await updateDoc(doc(db, 'users', userId), {
            status: sanitizeInput(status),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        throw new ApiError('Failed to update user status', 'UPDATE_USER_STATUS_ERROR');
    }
}

/**
 * Get dashboard statistics
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Dashboard statistics
 */
async function getDashboardStats(userId) {
    try {
        const accounts = await getUserAccounts(userId);
        const transactions = await getUserTransactions(userId, 30);
        const loans = await getUserLoans(userId);

        // Calculate totals
        const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
        const totalDebt = loans
            .filter(loan => loan.status === 'approved')
            .reduce((sum, loan) => sum + (loan.amount || 0), 0);

        // Calculate income and expenses this month
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const monthlyTransactions = transactions.filter(t => {
            const date = t.createdAt?.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
            return date >= startOfMonth;
        });

        const income = monthlyTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        const expenses = monthlyTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
            totalBalance,
            totalDebt,
            monthlyIncome: income,
            monthlyExpenses: expenses,
            accountsCount: accounts.length,
            activeLoans: loans.filter(l => l.status === 'approved').length,
            recentTransactions: transactions.slice(0, 5)
        };
    } catch (error) {
        handleError(error, 'getDashboardStats');
        return {
            totalBalance: 0,
            totalDebt: 0,
            monthlyIncome: 0,
            monthlyExpenses: 0,
            accountsCount: 0,
            activeLoans: 0,
            recentTransactions: []
        };
    }
}

/**
 * Generate a random account number
 * @returns {string} Generated account number
 */
function generateAccountNumber() {
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${timestamp}${random}`;
}

/**
 * Calculate interest rate based on loan type
 * @param {string} loanType - Type of loan
 * @returns {number} Interest rate percentage
 */
function calculateInterestRate(loanType) {
    const rates = {
        'personal': 12.5,
        'home': 8.5,
        'auto': 9.5,
        'education': 7.5,
        'business': 11.0
    };
    return rates[loanType] || 12.5;
}

export {
    getUserAccounts,
    getAccountById,
    createAccount,
    getAccountTransactions,
    getUserTransactions,
    createTransfer,
    getUserLoans,
    applyForLoan,
    getPendingLoans,
    updateLoanStatus,
    getAllUsers,
    updateUserRole,
    updateUserStatus,
    getDashboardStats
};
