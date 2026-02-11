"use strict";

/**
 * Authentication Module for SecureBank Application
 * Handles user authentication with Firebase Auth
 * @module core/auth
 */

import { getAuthInstance, getDbInstance, initializeFirebase } from './firebase.js';
import { handleError, AuthError } from './errorHandler.js';

// Auth state
let currentUser = null;
let authStateListeners = [];

/**
 * Initialize authentication and set up auth state observer
 * @returns {Promise<void>}
 */
async function initAuth() {
    try {
        await initializeFirebase();

        const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuthInstance();

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Get user data from Firestore
                const userData = await getUserData(user.uid);
                currentUser = userData || {};
                currentUser.uid = user.uid;
                currentUser.email = user.email;
            } else {
                currentUser = null;
            }

            // Notify all listeners
            notifyAuthStateListeners(currentUser);
        });
    } catch (error) {
        handleError(error, 'initAuth');
    }
}

/**
 * Register a new user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} userData - Additional user data
 * @returns {Promise<Object>} Created user object
 */
async function registerUser(email, password, userData) {
    try {
        await initializeFirebase();
        const { createUserWithEmailAndPassword, updateProfile } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

        const auth = getAuthInstance();
        const db = getDbInstance();

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        if (userData.displayName) {
            await updateProfile(user, { displayName: userData.displayName });
        }

        // Create user document in Firestore
        const userDoc = {
            email: email,
            displayName: userData.displayName || '',
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            phone: userData.phone || '',
            role: 'customer', // Default role
            status: 'active',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        await setDoc(doc(db, 'users', user.uid), userDoc);

        // Create default checking account
        const accountDoc = {
            userId: user.uid,
            accountType: 'checking',
            accountNumber: generateAccountNumber(),
            balance: 0,
            currency: 'USD',
            status: 'active',
            createdAt: serverTimestamp()
        };

        await setDoc(doc(db, 'accounts', `${user.uid}_checking`), accountDoc);

        return { user, userData: userDoc };
    } catch (error) {
        throw new AuthError(getAuthErrorMessage(error.code), error.code);
    }
}

/**
 * Sign in user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Signed in user object
 */
async function signIn(email, password) {
    try {
        await initializeFirebase();
        const { signInWithEmailAndPassword } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuthInstance();

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userData = await getUserData(userCredential.user.uid);

        return { user: userCredential.user, userData };
    } catch (error) {
        throw new AuthError(getAuthErrorMessage(error.code), error.code);
    }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
async function signOut() {
    try {
        await initializeFirebase();
        const { signOut: firebaseSignOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuthInstance();

        await firebaseSignOut(auth);
        currentUser = null;
    } catch (error) {
        throw new AuthError('Failed to sign out. Please try again.', 'SIGN_OUT_ERROR');
    }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
async function resetPassword(email) {
    try {
        await initializeFirebase();
        const { sendPasswordResetEmail } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const auth = getAuthInstance();

        await sendPasswordResetEmail(auth, email);
    } catch (error) {
        throw new AuthError(getAuthErrorMessage(error.code), error.code);
    }
}

/**
 * Get user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User data
 */
async function getUserData(uid) {
    try {
        await initializeFirebase();
        const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        const userDoc = await getDoc(doc(db, 'users', uid));

        if (userDoc.exists()) {
            return userDoc.data();
        }

        return null;
    } catch (error) {
        handleError(error, 'getUserData');
        return null;
    }
}

/**
 * Update user profile
 * @param {string} uid - User ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
async function updateUserProfile(uid, data) {
    try {
        await initializeFirebase();
        const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        const db = getDbInstance();

        await updateDoc(doc(db, 'users', uid), {
            ...data,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        throw new AuthError('Failed to update profile. Please try again.', 'PROFILE_UPDATE_ERROR');
    }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
function getCurrentUser() {
    return currentUser;
}

/**
 * Check if user is authenticated
 * @returns {boolean} Whether user is authenticated
 */
function isAuthenticated() {
    return currentUser !== null;
}

/**
 * Check if user has specific role
 * @param {string} role - Role to check
 * @returns {boolean} Whether user has role
 */
function hasRole(role) {
    return currentUser && currentUser.role === role;
}

/**
 * Check if user is admin
 * @returns {boolean} Whether user is admin
 */
function isAdmin() {
    return hasRole('admin');
}

/**
 * Check if user is employee
 * @returns {boolean} Whether user is employee or admin
 */
function isEmployee() {
    return hasRole('employee') || hasRole('admin');
}

/**
 * Add auth state change listener
 * @param {Function} listener - Callback function
 */
function onAuthStateChange(listener) {
    authStateListeners.push(listener);
}

/**
 * Remove auth state change listener
 * @param {Function} listener - Callback function to remove
 */
function removeAuthStateListener(listener) {
    authStateListeners = authStateListeners.filter(l => l !== listener);
}

/**
 * Notify all auth state listeners
 * @param {Object|null} user - Current user
 */
function notifyAuthStateListeners(user) {
    authStateListeners.forEach(listener => {
        try {
            listener(user);
        } catch (error) {
            console.error('Auth state listener error:', error);
        }
    });
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
 * Get user-friendly error message for auth errors
 * @param {string} code - Firebase error code
 * @returns {string} User-friendly error message
 */
function getAuthErrorMessage(code) {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please sign in or use a different email.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/operation-not-allowed': 'This operation is not allowed. Please contact support.',
        'auth/weak-password': 'Password is too weak. Please use at least 6 characters.',
        'auth/user-disabled': 'This account has been disabled. Please contact support.',
        'auth/user-not-found': 'No account found with this email. Please register first.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your internet connection.',
        'auth/invalid-credential': 'Invalid credentials. Please check your email and password.'
    };

    return errorMessages[code] || 'An error occurred. Please try again.';
}

export {
    initAuth,
    registerUser,
    signIn,
    signOut,
    resetPassword,
    getUserData,
    updateUserProfile,
    getCurrentUser,
    isAuthenticated,
    hasRole,
    isAdmin,
    isEmployee,
    onAuthStateChange,
    removeAuthStateListener
};
