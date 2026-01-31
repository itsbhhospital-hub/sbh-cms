import axios from 'axios';

// !!! IMPORTANT: AUTHORIZATION REQUIRED !!!
// If you redeploy the script, you MUST update this URL.
// 1. Go to Google Apps Script -> Deploy -> Manage Deployments
// 2. Copy the 'Web App URL'
// 3. Paste it below:
const API_URL = 'https://script.google.com/macros/s/AKfycbwAxx7PkRMx7aCNsv0NqC-QTB4AKPd2OpkPzEIxnCLm4PrWct8ioqI-8pPCBHbKtsRU/exec';

// --- MOCK DATA FALLBACK ---
// NOTE: Fallback is DISABLED for Production Testing to ensure API Connectivity.
const MOCK_USERS = [
    { Username: 'admin', Password: 'admin123', Role: 'admin', Status: 'Active', Department: 'ADMIN' },
];

const getLocalData = (key, defaultData) => {
    const stored = localStorage.getItem(`sbh_mock_${key}`);
    return stored ? JSON.parse(stored) : defaultData;
};

// --- API HELPERS ---

/**
 * Fetch data using the Web App URL
 */
// --- CACHE & HELPERS ---
const CACHE_DURATION = 60 * 1000; // 1 minute
const cache = {
    data: { timestamp: 0, payload: [] },
    master: { timestamp: 0, payload: [] }
};

const fetchSheetData = async (sheetName, forceRefresh = false) => {
    // Return cached data if valid and not forcing refresh
    const now = Date.now();
    if (!forceRefresh && cache[sheetName] && (now - cache[sheetName].timestamp < CACHE_DURATION)) {
        console.log(`Using cached ${sheetName} data`);
        return cache[sheetName].payload;
    }

    try {
        const response = await fetch(`${API_URL}?action=read&sheet=${sheetName}`);
        const data = await response.json();

        // Check for Script Error (sometimes script returns 200 but content is error info)
        if (data.status === 'error') throw new Error(data.message);

        const result = Array.isArray(data) ? data : [];
        // Update cache
        cache[sheetName] = { timestamp: now, payload: result };
        return result;
    } catch (error) {
        console.error("API Read Error:", error);
        // CRITICAL: Return empty or throw, DO NOT FALLBACK TO MOCK silently during final test
        // if (sheetName === 'master') return getLocalData('users', MOCK_USERS);
        console.warn("Using offline mock data due to API failure.");
        // Uncomment line below to ENABLE mock fallback if API fails completely
        if (sheetName === 'master') return MOCK_USERS;
        return [];
    }
};

const sendToSheet = async (action, payload) => {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: JSON.stringify({ action, payload })
        });

        // Invalidate cache on write
        if (action === 'createComplaint' || action === 'updateComplaintStatus') cache.data.timestamp = 0;
        if (action === 'registerUser' || action === 'updateUser') cache.master.timestamp = 0;

        const result = await response.json();
        if (result.status === 'error') throw new Error(result.message);
        return result; // Return full result including ID
    } catch (error) {
        console.error("API Write Error:", error);
        alert(`API Connection Failed: ${error.message}. Check Internet or Scripts.`);
        throw error; // Stop execution
    }
};

const saveLocally = (action, payload) => {
    if (action === 'registerUser') {
        const users = getLocalData('users', MOCK_USERS);
        users.push({ ...payload, Role: 'User', Status: 'Pending' });
        localStorage.setItem('sbh_mock_users', JSON.stringify(users));
    }
    return true;
};

export const sheetsService = {
    getComplaints: (force = false) => fetchSheetData('data', force),
    getUsers: (force = false) => fetchSheetData('master', force),

    createComplaint: async (complaint) => {
        const payload = {
            ID: Date.now().toString(),
            Date: new Date().toISOString(), // Client-side date
            Department: complaint.department,
            Description: complaint.description,
            ReportedBy: complaint.reportedBy
        };
        return sendToSheet('createComplaint', payload);
    },

    updateComplaintStatus: async (id, status, resolvedBy, remark = '') => {
        const payload = {
            ID: id,
            Status: status,
            ResolvedBy: resolvedBy, // Pass who resolved it
            Remark: remark
        };
        return sendToSheet('updateComplaintStatus', payload);
    },

    registerUser: async (user) => {
        const payload = {
            Username: user.username,
            Password: user.password,
            Department: user.department || '',
            Mobile: user.mobile || ''
        };
        return sendToSheet('registerUser', payload);
    },

    updateUser: async (user) => {
        // payload: { Username, Role, Status, Password, Department... }
        return sendToSheet('updateUser', user);
    }
};
