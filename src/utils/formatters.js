/**
 * Formatters for API data used throughout the application
 */

// Format timestamp to readable date
export const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString();
};

// Format numeric values with commas and fixed decimals
export const formatNumber = (value, decimals = 0) => {
    if (value === null || value === undefined) return 'N/A';
    return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });
};

// Format percentage values
export const formatPercent = (value) => {
    if (value === null || value === undefined) return 'N/A';
    // Handle if value is already a string with % sign
    if (typeof value === 'string' && value.includes('%')) return value;

    return `${Number(value).toFixed(1)}%`;
};

// Truncate text to a specific length
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength
        ? `${text.substring(0, maxLength)}...`
        : text;
};

// Format SQL queries for display
export const formatSqlQuery = (query) => {
    if (!query) return '';

    // Basic SQL formatting - could be expanded with a proper SQL formatter library
    return query
        .replace(/SELECT/gi, 'SELECT\n  ')
        .replace(/FROM/gi, '\nFROM')
        .replace(/WHERE/gi, '\nWHERE')
        .replace(/GROUP BY/gi, '\nGROUP BY')
        .replace(/ORDER BY/gi, '\nORDER BY')
        .replace(/LIMIT/gi, '\nLIMIT')
        .replace(/,/g, ',\n  ');
};

// Calculate time elapsed
export const timeElapsed = (timestamp) => {
    if (!timestamp) return 'N/A';

    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now - then;

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
};

export default {
    formatDate,
    formatNumber,
    formatPercent,
    truncateText,
    formatSqlQuery,
    timeElapsed,
};
