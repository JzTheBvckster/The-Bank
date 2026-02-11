/**
 * Sidebar Component
 * Reusable sidebar navigation component
 */

import { signOutUser } from '../core/auth.js';
import { showToast } from '../core/utils.js';

/**
 * Sidebar configuration
 */
const SIDEBAR_CONFIG = {
    logo: {
        icon: '🏦',
        text: 'SecureBank',
        href: '/public/index.html'
    },
    navItems: {
        customer: [
            { icon: '📊', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { icon: '💳', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { icon: '💸', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { icon: '📋', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' }
        ],
        employee: [
            { icon: '📊', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { icon: '💳', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { icon: '💸', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { icon: '📋', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' },
            { icon: '⚙️', text: 'Admin', href: '/src/features/admin/admin.html', id: 'admin' }
        ],
        admin: [
            { icon: '📊', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { icon: '💳', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { icon: '💸', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { icon: '📋', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' },
            { icon: '⚙️', text: 'Admin', href: '/src/features/admin/admin.html', id: 'admin' }
        ]
    }
};

/**
 * Create sidebar element
 * @param {string} activePage - Current active page id
 * @param {string} userRole - User role (customer, employee, admin)
 * @returns {HTMLElement} Sidebar element
 */
export function createSidebar(activePage = '', userRole = 'customer') {
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar';
    sidebar.id = 'sidebar';

    // Header
    const header = document.createElement('div');
    header.className = 'sidebar-header';

    const logo = document.createElement('a');
    logo.href = SIDEBAR_CONFIG.logo.href;
    logo.className = 'logo';
    logo.innerHTML = `
        <span class="logo-icon">${SIDEBAR_CONFIG.logo.icon}</span>
        <span class="logo-text">${SIDEBAR_CONFIG.logo.text}</span>
    `;
    header.appendChild(logo);

    // Navigation
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';

    const navItems = SIDEBAR_CONFIG.navItems[userRole] || SIDEBAR_CONFIG.navItems.customer;

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `nav-item${item.id === activePage ? ' active' : ''}`;
        link.innerHTML = `
            <span class="nav-icon">${item.icon}</span>
            <span>${item.text}</span>
        `;
        nav.appendChild(link);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-item';
    logoutBtn.id = 'logoutBtn';
    logoutBtn.innerHTML = `
        <span class="nav-icon">🚪</span>
        <span>Logout</span>
    `;
    logoutBtn.addEventListener('click', handleLogout);
    footer.appendChild(logoutBtn);

    // Assemble sidebar
    sidebar.appendChild(header);
    sidebar.appendChild(nav);
    sidebar.appendChild(footer);

    return sidebar;
}

/**
 * Handle logout
 */
async function handleLogout() {
    try {
        await signOutUser();
        window.location.href = '/src/features/auth/login.html';
    } catch (error) {
        showToast('Failed to logout', 'error');
    }
}

/**
 * Toggle sidebar visibility (for mobile)
 */
export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar?.classList.toggle('active');
}

/**
 * Initialize sidebar for a page
 * @param {HTMLElement} container - Container to append sidebar to
 * @param {string} activePage - Current active page id
 * @param {string} userRole - User role
 */
export function initSidebar(container, activePage, userRole = 'customer') {
    const sidebar = createSidebar(activePage, userRole);
    container.insertBefore(sidebar, container.firstChild);
}

export default {
    createSidebar,
    toggleSidebar,
    initSidebar
};
