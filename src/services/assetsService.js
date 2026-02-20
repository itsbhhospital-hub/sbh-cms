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
                return result.data.map(asset => ({
                    ...asset,
                    id: asset.id || asset.assetId || asset.AssetID || asset.assetID
                }));
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
            // Explicitly map keys to match Backend/Sheet Headers if needed
            Description: data.remark || data.description || '',
            VendorMobile: data.vendorMobile || '',
            ResponsiblePerson: data.responsiblePerson || '',
            ResponsibleMobile: data.responsibleMobile || '',
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
     */
    async addServiceRecord(data, file, fileName, fileType) {
        let fileBase64 = "";
        if (file) {
            fileBase64 = await this.fileToBase64(file);
        }

        const payload = {
            action: 'addServiceRecord',
            id: data.id,
            serviceDate: data.serviceDate,
            nextServiceDate: data.nextServiceDate,
            remark: data.remark,
            serviceType: data.serviceType,
            serviceFile: fileBase64,
            serviceFileName: fileName,
            serviceFileType: fileType,
            cost: data.cost,
            location: data.location,
            department: data.department,
            responsiblePerson: data.responsiblePerson,
            responsibleMobile: data.responsibleMobile
        };

        return await sendPost(payload);
    },

    async editAsset(data) {
        // data: { id, machineName, purchaseCost, ... }
        const payload = {
            action: 'editAsset',
            ...data
        };
        return await sendPost(payload);
    },

    async markAsReplaced(data) {
        // data: { id, reason, remark, newMachineData }
        // newMachineData should contain invoiceFile etc if available

        let invoiceBase64 = "";
        if (data.newMachineData.invoiceFile) {
            invoiceBase64 = await this.fileToBase64(data.newMachineData.invoiceFile);
        }

        const payload = {
            action: 'markAsReplaced',
            id: data.id,
            reason: data.reason,
            remark: data.remark,
            createdBy: data.createdBy,
            newMachineData: {
                ...data.newMachineData,
                invoiceFile: invoiceBase64
            }
        };
        return await sendPost(payload);
    },

    /**
     * Helper to convert file to Base64
     */
    fileToBase64: (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                const result = reader.result;
                // backend expects just base64 data without prefix if using Utilities.base64Decode
                // But let's split just in case
                const base64 = result.includes(',') ? result.split(',')[1] : result;
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
