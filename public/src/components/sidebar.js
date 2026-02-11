/**
 * Sidebar Component
 * Reusable sidebar navigation component
 */

import { signOutUser } from '../core/auth.js';
import { showToast, createIcon } from '../core/utils.js';

/**
 * Sidebar configuration
 */
const SIDEBAR_CONFIG = {
    logo: {
        iconId: 'bank',
        text: 'SecureBank',
        href: '/index.html'
    },
    navItems: {
        customer: [
            { iconId: 'dashboard', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { iconId: 'card', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { iconId: 'transfer', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { iconId: 'document', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' }
        ],
        employee: [
            { iconId: 'dashboard', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { iconId: 'card', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { iconId: 'transfer', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { iconId: 'document', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' },
            { iconId: 'settings', text: 'Admin', href: '/src/features/admin/admin.html', id: 'admin' }
        ],
        admin: [
            { iconId: 'dashboard', text: 'Dashboard', href: '/src/features/dashboard/dashboard.html', id: 'dashboard' },
            { iconId: 'card', text: 'Accounts', href: '/src/features/accounts/accounts.html', id: 'accounts' },
            { iconId: 'transfer', text: 'Transfers', href: '/src/features/transfers/transfers.html', id: 'transfers' },
            { iconId: 'document', text: 'Loans', href: '/src/features/loans/loans.html', id: 'loans' },
            { iconId: 'settings', text: 'Admin', href: '/src/features/admin/admin.html', id: 'admin' }
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
    const logoIcon = document.createElement('span');
    logoIcon.className = 'logo-icon';
    logoIcon.appendChild(createIcon(SIDEBAR_CONFIG.logo.iconId));
    const logoText = document.createElement('span');
    logoText.className = 'logo-text';
    logoText.textContent = SIDEBAR_CONFIG.logo.text;
    logo.appendChild(logoIcon);
    logo.appendChild(logoText);
    header.appendChild(logo);

    // Navigation
    const nav = document.createElement('nav');
    nav.className = 'sidebar-nav';

    const navItems = SIDEBAR_CONFIG.navItems[userRole] || SIDEBAR_CONFIG.navItems.customer;

    navItems.forEach(item => {
        const link = document.createElement('a');
        link.href = item.href;
        link.className = `nav-item${item.id === activePage ? ' active' : ''}`;
        const icon = document.createElement('span');
        icon.className = 'nav-icon';
        icon.appendChild(createIcon(item.iconId));

        const text = document.createElement('span');
        text.textContent = item.text;

        link.appendChild(icon);
        link.appendChild(text);
        nav.appendChild(link);
    });

    // Footer
    const footer = document.createElement('div');
    footer.className = 'sidebar-footer';

    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'nav-item';
    logoutBtn.id = 'logoutBtn';
    const logoutIcon = document.createElement('span');
    logoutIcon.className = 'nav-icon';
    logoutIcon.appendChild(createIcon('logout'));
    const logoutText = document.createElement('span');
    logoutText.textContent = 'Logout';
    logoutBtn.appendChild(logoutIcon);
    logoutBtn.appendChild(logoutText);
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
