/**
 * Topbar Component
 * Reusable top navigation bar component
 */

/**
 * Create topbar element
 * @param {Object} options - Topbar options
 * @param {string} options.title - Page title
 * @param {string} options.userName - User's display name
 * @param {Function} options.onMenuToggle - Menu toggle callback
 * @returns {HTMLElement} Topbar element
 */
export function createTopbar(options = {}) {
    const {
        title = 'Dashboard',
        userName = 'User',
        onMenuToggle = null
    } = options;

    const topbar = document.createElement('header');
    topbar.className = 'topbar';

    // Menu toggle button
    const menuToggle = document.createElement('button');
    menuToggle.className = 'menu-toggle';
    menuToggle.id = 'menuToggle';
    menuToggle.textContent = '☰';
    menuToggle.addEventListener('click', () => {
        if (onMenuToggle) {
            onMenuToggle();
        } else {
            document.getElementById('sidebar')?.classList.toggle('active');
        }
    });

    // Page title
    const pageTitle = document.createElement('h1');
    pageTitle.className = 'page-title';
    pageTitle.textContent = title;

    // Actions area
    const actions = document.createElement('div');
    actions.className = 'topbar-actions';

    // Theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.id = 'themeToggle';
    themeToggle.setAttribute('aria-label', 'Toggle theme');

    const savedTheme = localStorage.getItem('theme') || 'light';
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    });

    // User menu
    const userMenu = document.createElement('div');
    userMenu.className = 'user-menu';

    const userNameSpan = document.createElement('span');
    userNameSpan.className = 'user-name';
    userNameSpan.id = 'userName';
    userNameSpan.textContent = userName;

    const userAvatar = document.createElement('span');
    userAvatar.className = 'user-avatar';
    userAvatar.textContent = '👤';

    userMenu.appendChild(userNameSpan);
    userMenu.appendChild(userAvatar);

    actions.appendChild(themeToggle);
    actions.appendChild(userMenu);

    // Assemble topbar
    topbar.appendChild(menuToggle);
    topbar.appendChild(pageTitle);
    topbar.appendChild(actions);

    return topbar;
}

/**
 * Update topbar title
 * @param {string} title - New title
 */
export function updateTopbarTitle(title) {
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
        pageTitle.textContent = title;
    }
}

/**
 * Update topbar user name
 * @param {string} name - User's display name
 */
export function updateTopbarUserName(name) {
    const userName = document.getElementById('userName');
    if (userName) {
        userName.textContent = name;
    }
}

/**
 * Initialize theme from localStorage
 */
export function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

export default {
    createTopbar,
    updateTopbarTitle,
    updateTopbarUserName,
    initTheme
};
