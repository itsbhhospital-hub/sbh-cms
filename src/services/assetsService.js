import axios from 'axios';

// IMPORTANT: This URL must be set in your .env file
// VITE_ASSETS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
const ASSETS_API_URL = import.meta.env.VITE_ASSETS_SCRIPT_URL;

/**
 * Service for interacting with the SBH Assets Management System backend.
 */
export const assetsService = {

    /**
     * Fetch all assets for the Admin Dashboard.
     * @returns {Promise<Array>} List of assets.
     */
    getAssets: async () => {
        try {
            if (!ASSETS_API_URL) throw new Error("Assets API URL is not configured.");

            const response = await fetch(`${ASSETS_API_URL}?action=getAssets`);
            const result = await response.json();

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message || 'Failed to fetch assets');
            }
        } catch (error) {
            console.error("Assets fetch error:", error);
            return [];
        }
    },

    /**
     * Fetch details for a specific asset, including service history.
     * @param {string} id - Asset ID (e.g., SBH1)
     * @returns {Promise<Object>} Asset details.
     */
    getAssetDetails: async (id) => {
        try {
            const response = await fetch(`${ASSETS_API_URL}?action=getAssetDetails&id=${id}`);
            const result = await response.json();

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Asset details error:", error);
            throw error;
        }
    },

    /**
     * Public (Read-only) details for QR Code scan.
     * @param {string} id - Asset ID
     */
    getPublicAssetDetails: async (id) => {
        try {
            const response = await fetch(`${ASSETS_API_URL}?action=getPublicAssetDetails&id=${id}`);
            const result = await response.json();

            if (result.status === 'success') {
                return result.data;
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Public asset error:", error);
            throw error;
        }
    },

    /**
     * Create a new asset with invoice upload.
     * @param {Object} formData 
     */
    addAsset: async (data, invoiceFileBase64, invoiceFileName, invoiceType) => {
        const payload = {
            action: 'addAsset',
            ...data,
            invoiceFile: invoiceFileBase64,
            invoiceName: invoiceFileName,
            invoiceType: invoiceType
        };

        return sendPost(payload);
    },

    /**
     * Add a service record with invoice upload.
     * @param {Object} data - { id, serviceDate, nextServiceDate, remark }
     * @param {string} fileBase64 
     * @param {string} fileName 
     * @param {string} fileType 
     */
    addServiceRecord: async (data, fileBase64, fileName, fileType) => {
        const payload = {
            action: 'addServiceRecord',
            ...data,
            serviceFile: fileBase64,
            serviceFileName: fileName,
            serviceFileType: fileType
        };

        return sendPost(payload);
    },

    /**
     * Helper to convert file to Base64
     */
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                // Remove "data:*/*;base64," prefix for Apps Script compatibility if needed
                // But usually helpful to keep it or strip it depending on backend.
                // Our backend uses Utilities.newBlob(Utilities.base64Decode(data))
                // Utilities.base64Decode expects pure base64.
                const result = reader.result;
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = error => reject(error);
        });
    }
};

/**
 * Helper for POST requests
 */
async function sendPost(payload) {
    try {
        const response = await fetch(ASSETS_API_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
            // Note: Apps Script Web Apps don't like CORS OPTIONS preflight with custom headers.
            // Content-Type: text/plain is standard hack to avoid CORS preflight options.
        });

        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message || 'Operation failed');
        return result;
    } catch (error) {
        console.error("Asset Post Error:", error);
        throw error;
    }
}
