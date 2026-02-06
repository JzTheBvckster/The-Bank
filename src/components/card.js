/**
 * Card Component
 * Reusable card components for displaying content
 */

import { createElement } from '../core/utils.js';

/**
 * Create a basic card element
 * @param {Object} options - Card options
 * @param {string} options.title - Card header title
 * @param {string|HTMLElement} options.content - Card body content
 * @param {string} options.footer - Card footer content
 * @param {string} options.className - Additional CSS classes
 * @param {string} options.headerAction - Header action button HTML
 * @returns {HTMLElement} Card element
 */
export function createCard(options = {}) {
    const {
        title = '',
        content = '',
        footer = '',
        className = '',
        headerAction = ''
    } = options;

    const card = createElement('div', { className: `card ${className}`.trim() });

    // Header (if title provided)
    if (title) {
        const header = createElement('div', { className: 'card-header' });
        header.appendChild(createElement('h3', { textContent: title }));

        if (headerAction) {
            const actionContainer = createElement('div');
            actionContainer.innerHTML = headerAction;
            header.appendChild(actionContainer);
        }

        card.appendChild(header);
    }

    // Body
    const body = createElement('div', { className: 'card-body' });
    if (typeof content === 'string') {
        body.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        body.appendChild(content);
    }
    card.appendChild(body);

    // Footer (if provided)
    if (footer) {
        const footerElement = createElement('div', { className: 'card-footer' });
        if (typeof footer === 'string') {
            footerElement.innerHTML = footer;
        } else if (footer instanceof HTMLElement) {
            footerElement.appendChild(footer);
        }
        card.appendChild(footerElement);
    }

    return card;
}

/**
 * Create a stat card element
 * @param {Object} options - Stat card options
 * @param {string} options.icon - Icon emoji or HTML
 * @param {string} options.label - Stat label
 * @param {string|number} options.value - Stat value
 * @param {string} options.trend - Trend indicator (up, down, neutral)
 * @param {string} options.trendValue - Trend percentage
 * @param {string} options.color - Card accent color
 * @returns {HTMLElement} Stat card element
 */
export function createStatCard(options = {}) {
    const {
        icon = '📊',
        label = 'Stat',
        value = '0',
        trend = 'neutral',
        trendValue = '',
        color = 'primary'
    } = options;

    const card = createElement('div', { className: `stat-card stat-card-${color}` });

    // Icon
    const iconElement = createElement('div', { className: 'stat-card-icon' });
    iconElement.innerHTML = icon;

    // Content
    const content = createElement('div', { className: 'stat-card-content' });
    content.appendChild(createElement('span', { className: 'stat-card-value', textContent: value }));
    content.appendChild(createElement('span', { className: 'stat-card-label', textContent: label }));

    // Trend (if provided)
    if (trendValue) {
        const trendElement = createElement('div', { className: `stat-card-trend trend-${trend}` });
        const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→';
        trendElement.textContent = `${trendIcon} ${trendValue}`;
        content.appendChild(trendElement);
    }

    card.appendChild(iconElement);
    card.appendChild(content);

    return card;
}

/**
 * Create an account card element
 * @param {Object} account - Account data
 * @param {string} account.type - Account type
 * @param {string} account.accountNumber - Account number
 * @param {number} account.balance - Account balance
 * @param {string} account.currency - Currency code
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} Account card element
 */
export function createAccountCard(account, onClick = null) {
    const { type, accountNumber, balance, currency = 'USD' } = account;

    const typeIcons = {
        checking: '💳',
        savings: '🏦',
        business: '💼',
        investment: '📈'
    };

    const card = createElement('div', { className: 'account-card' });
    if (onClick) {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => onClick(account));
    }

    // Header
    const header = createElement('div', { className: 'account-card-header' });
    header.appendChild(createElement('span', { className: 'account-icon', textContent: typeIcons[type] || '💳' }));
    header.appendChild(createElement('span', { className: 'account-type', textContent: type.charAt(0).toUpperCase() + type.slice(1) }));

    // Body
    const body = createElement('div', { className: 'account-card-body' });

    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    });

    body.appendChild(createElement('span', { className: 'account-balance', textContent: formatter.format(balance) }));
    body.appendChild(createElement('span', { className: 'account-number', textContent: `****${accountNumber.slice(-4)}` }));

    card.appendChild(header);
    card.appendChild(body);

    return card;
}

/**
 * Create a transaction card element
 * @param {Object} transaction - Transaction data
 * @param {string} transaction.type - Transaction type (credit, debit)
 * @param {string} transaction.description - Transaction description
 * @param {number} transaction.amount - Transaction amount
 * @param {Date|string} transaction.date - Transaction date
 * @param {string} transaction.status - Transaction status
 * @returns {HTMLElement} Transaction card element
 */
export function createTransactionCard(transaction) {
    const { type, description, amount, date, status = 'completed' } = transaction;

    const card = createElement('div', { className: 'transaction-card' });

    // Icon
    const icon = createElement('div', { className: `transaction-icon ${type}` });
    icon.textContent = type === 'credit' ? '↓' : '↑';

    // Details
    const details = createElement('div', { className: 'transaction-details' });
    details.appendChild(createElement('span', { className: 'transaction-desc', textContent: description }));

    const dateStr = date instanceof Date ? date.toLocaleDateString() : new Date(date).toLocaleDateString();
    details.appendChild(createElement('span', { className: 'transaction-date', textContent: dateStr }));

    // Amount
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    });

    const amountElement = createElement('div', { className: `transaction-amount ${type}` });
    amountElement.textContent = `${type === 'credit' ? '+' : '-'}${formatter.format(Math.abs(amount))}`;

    // Status badge
    if (status !== 'completed') {
        const statusBadge = createElement('span', {
            className: `badge badge-${status === 'pending' ? 'warning' : 'danger'}`,
            textContent: status
        });
        amountElement.appendChild(statusBadge);
    }

    card.appendChild(icon);
    card.appendChild(details);
    card.appendChild(amountElement);

    return card;
}

/**
 * Create an empty state card
 * @param {Object} options - Empty state options
 * @param {string} options.icon - Icon emoji
 * @param {string} options.title - Empty state title
 * @param {string} options.message - Empty state message
 * @param {Object} options.action - Action button config
 * @returns {HTMLElement} Empty state element
 */
export function createEmptyState(options = {}) {
    const {
        icon = '📭',
        title = 'No data',
        message = 'There is nothing to display.',
        action = null
    } = options;

    const container = createElement('div', { className: 'empty-state' });

    container.appendChild(createElement('span', { className: 'empty-icon', textContent: icon }));
    container.appendChild(createElement('h3', { textContent: title }));
    container.appendChild(createElement('p', { textContent: message }));

    if (action) {
        const btn = createElement('button', {
            className: `btn ${action.className || 'btn-primary'}`,
            textContent: action.text
        });
        if (action.onClick) {
            btn.addEventListener('click', action.onClick);
        }
        container.appendChild(btn);
    }

    return container;
}

export default {
    createCard,
    createStatCard,
    createAccountCard,
    createTransactionCard,
    createEmptyState
};
