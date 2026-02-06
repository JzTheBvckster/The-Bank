"use strict";

/**
 * Firebase Configuration and Initialization Module
 * Handles Firebase setup for authentication, Firestore, and Storage
 * @module core/firebase
 */

/**
 * Firebase configuration object
 */
const firebaseConfig = {
    apiKey: "AIzaSyAYxviK8D-gJHkOY1Huu63cCwA9atTP1hk",
    authDomain: "the-bank-4f43b.firebaseapp.com",
    projectId: "the-bank-4f43b",
    storageBucket: "the-bank-4f43b.firebasestorage.app",
    messagingSenderId: "51114534884",
    appId: "1:51114534884:web:0a367e1289178ec14489f1",
    measurementId: "G-NQ39MB9KZ6"
};

// Firebase app instance
let app = null;
let auth = null;
let db = null;
let storage = null;

/**
 * Initialize Firebase application
 * @returns {Promise<Object>} Firebase app instance
 */
async function initializeFirebase() {
    try {
        // Dynamic import of Firebase modules (v12.9.0)
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js');
        const { getStorage } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-storage.js');
        const { getAnalytics } = await import('https://www.gstatic.com/firebasejs/12.9.0/firebase-analytics.js');

        // Initialize Firebase
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);

        // Initialize Analytics
        const analytics = getAnalytics(app);

        console.log('Firebase initialized successfully');
        return { app, auth, db, storage, analytics };
    } catch (error) {
        console.error('Firebase initialization error:', error);
        throw error;
    }
}

/**
 * Get Firebase Auth instance
 * @returns {Object} Firebase Auth instance
 */
function getAuthInstance() {
    return auth;
}

/**
 * Get Firestore instance
 * @returns {Object} Firestore instance
 */
function getDbInstance() {
    return db;
}

/**
 * Get Firebase Storage instance
 * @returns {Object} Firebase Storage instance
 */
function getStorageInstance() {
    return storage;
}

/**
 * Check if Firebase is initialized
 * @returns {boolean} Whether Firebase is initialized
 */
function isFirebaseInitialized() {
    return app !== null;
}

export {
    initializeFirebase,
    getAuthInstance,
    getDbInstance,
    getStorageInstance,
    isFirebaseInitialized
};
