/**
 * Global Data Normalization Utilities for SBH CMS
 */

/**
 * Normalizes a string for comparison.
 * Trims whitespace and converts to lowercase.
 * Handles null/undefined safely.
 * @param {string} val 
 * @returns {string}
 */
export const normalize = (val) => {
    return String(val || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

/**
 * Safely converts a value to a number.
 * Returns 0 if NaN or invalid.
 * @param {any} val 
 * @returns {number}
 */
export const safeNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
};

/**
 * Formats a number to a fixed decimal string, avoiding NaN.
 * @param {any} val 
 * @param {number} decimals 
 * @returns {string}
 */
export const formatNumber = (val, decimals = 1) => {
    return safeNumber(val).toFixed(decimals);
};
