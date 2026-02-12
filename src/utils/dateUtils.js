/**
 * Enterprise Date Utility for SBH CMS
 * Enforces Indian Standard Time (IST) display regardless of client device settings.
 */

/**
 * Formats an ISO timestamp or Date object to "DD MMM, hh:mm A" in IST.
 * @param {string|Date} dateInput - The date to format
 * @returns {string} - Formatted string (e.g., "12 Oct, 10:45 AM") or "N/A"
 */
export const formatIST = (dateInput) => {
    if (!dateInput) return 'N/A';

    try {
        const date = parseCustomDate(dateInput);
        if (!date || isNaN(date.getTime())) return 'N/A';

        // Display format: DD MMM YYYY • hh:mm A
        const day = date.getDate().toString().padStart(2, '0');
        const monthShort = date.toLocaleString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase();
        const year = date.getFullYear();

        let hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        const hStr = hours.toString().padStart(2, '0');

        return `${day} ${monthShort} ${year} • ${hStr}:${minutes} ${ampm}`;
    } catch (e) {
        console.error("Date formatting error:", e);
        return 'N/A';
    }
};

/**
 * Formats to just Date "DD MMM YYYY" in IST
 */
export const formatDateIST = (dateInput) => {
    if (!dateInput) return '-';
    try {
        const cleanDate = typeof dateInput === 'string' ? dateInput.replace(/'/g, '') : dateInput;
        const date = new Date(cleanDate);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return '-';
    }
};

/**
 * Formats to just Time "hh:mm A" in IST
 */
export const formatTimeIST = (dateInput) => {
    if (!dateInput) return '-';
    try {
        const cleanDate = typeof dateInput === 'string' ? dateInput.replace(/'/g, '') : dateInput;
        const date = new Date(cleanDate);
        if (isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('en-IN', {
            timeZone: 'Asia/Kolkata',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    } catch (e) {
        return '-';
    }
};

/**
 * Parses "dd-MM-yyyy hh:mm:ss a" or standard ISO strings
 */
export const parseCustomDate = (dateStr) => {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return dateStr;
    const clean = String(dateStr).replace(/'/g, '').replace('at', '').trim();

    // Check for DD-MM-YYYY or DD-MM-YYYY HH:mm:ss
    const dmyRegex = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(.*)/;
    const match = clean.match(dmyRegex);

    if (match) {
        const [_, d, m, y, rest] = match;
        const day = parseInt(d, 10);
        const month = parseInt(m, 10) - 1;
        const year = parseInt(y, 10);

        let hours = 0, minutes = 0, seconds = 0;
        if (rest && rest.trim()) {
            const timeMatch = rest.trim().match(/(\d{1,2}):(\d{1,2}):?(\d{1,2})?\s*(AM|PM)?/i);
            if (timeMatch) {
                hours = parseInt(timeMatch[1], 10);
                minutes = parseInt(timeMatch[2], 10);
                seconds = parseInt(timeMatch[3] || "0", 10);
                const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
                if (ampm === 'PM' && hours < 12) hours += 12;
                if (ampm === 'AM' && hours === 12) hours = 0;
            }
        }
        const dObj = new Date(year, month, day, hours, minutes, seconds);
        if (!isNaN(dObj.getTime())) return dObj;
    }

    const d = new Date(clean);
    return isNaN(d.getTime()) ? null : d;
};

export const getCurrentISO = () => {
    return new Date().toISOString();
};
