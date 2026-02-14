/*
 * SBH Enterprise Assets Management System
 * Backend Script (Google Apps Script)
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet. Rename it to "SBH Assets Data".
 * 2. Create a sheet tab named "data" inside it.
 * 3. Create a new Google Drive Folder for storing assets.
 * 4. Paste this code into Extensions > Apps Script.
 * 5. Update CONFIG object below with your Sheet ID and Drive Folder ID.
 * 6. Run `setupAssetsSheet` function once.
 * 7. Deploy as Web App (Execute as: Me, Who has access: Anyone).
 */

const CONFIG = {
    SHEET_ID: "1yqxmBzj24Vv4IYc-qfWaTgdN6isV_G7DRcRwsCGxNKU", // Provided by USER
    DRIVE_FOLDER_ID: "1N5dy31gADHN7Ln5p7MTRAs6KMACpt2yj",      // Provided by USER
    SHEET_NAME: "data",
    WHATSAPP: {
        API_URL: "https://app.ceoitbox.com/message/new",
        USERNAME: "SBH HOSPITAL",
        PASS: "123456789",
        ADMIN_PHONE: "" // TODO: Enter Admin Phone Number Here (e.g., 919999999999)
    }
};

/* --- INITIAL SETUP --- */

function setupAssetsSheet() {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) {
        sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    }

    const headers = [
        "Asset ID",            // 0
        "Machine Name",        // 1
        "Serial Number",       // 2
        "Purchase Date",       // 3
        "Purchase Invoice Link", // 4
        "Current Service Date", // 5
        "Next Service Date",   // 6
        "Remark",              // 7
        "QR Link",             // 8
        "Folder Link",         // 9
        "Created By",          // 10
        "Created Date",        // 11
        "Status"               // 12 (Active/Service Due/Retired)
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
}

/* --- API HANDLER --- */

function doGet(e) {
    return handleRequest(e);
}

function doPost(e) {
    return handleRequest(e);
}

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const params = e.parameter;


        // For POST requests, payload handles strict data
        let payload = {};
        if (e.postData && e.postData.contents) {
            try {
                payload = JSON.parse(e.postData.contents);
            } catch (err) {
                payload = {}; // Handle form-data if needed
            }
        }

        // Merge POST payload into params for easier handling
        const data = { ...params, ...payload };

        // FIX: Get action from merged data (supports both URL param and POST body)
        const action = data.action;

        let result;

        switch (action) {
            case "addAsset":
                result = addAsset(data);
                break;
            case "getAssets":
                result = getAssets(data);
                break;
            case "getAssetDetails":
                result = getAssetDetails(data.id);
                break;
            case "addServiceRecord":
                result = addServiceRecord(data);
                break;
            case "uploadFile":
                result = uploadFileToDrive(data);
                break;
            case "getPublicAssetDetails":
                result = getPublicAssetDetails(data.id);
                break;
            default:
                result = { status: "error", message: "Invalid Action" };
        }

        return ContentService.createTextOutput(JSON.stringify(result))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({
            status: "error",
            message: error.toString()
        })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

/* --- CORE FUNCTIONS --- */

function generateAssetId(sheet) {
    const lastRow = sheet.getLastRow();
    // If only header exists (row 1), first ID is SBH1
    // If lastRow is 1, next is 1. If lastRow is 5, next is 5 (row 6)
    // Logic: "SBH" + (lastRow)
    // Row 2 -> SBH1 (lastRow was 1)
    // Row 3 -> SBH2 (lastRow was 2)
    return "SBH" + lastRow;
}

function addAsset(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);

    if (!sheet) return { status: "error", message: "Sheet not found" };

    const id = generateAssetId(sheet);
    const timestamp = new Date();

    // 1. Create Drive Folders
    const rootFolder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    const assetFolder = rootFolder.createFolder(`${id} - ${data.machineName}`);
    const invoiceFolder = assetFolder.createFolder("Purchase Invoice");
    const serviceFolder = assetFolder.createFolder("Service History"); // Pre-create for later

    // 2. Handle Purchase Invoice Upload (if provided)
    let invoiceLink = "";
    if (data.invoiceFile && data.invoiceName) {
        const fileBlob = Utilities.newBlob(Utilities.base64Decode(data.invoiceFile), data.invoiceType, data.invoiceName);
        const file = invoiceFolder.createFile(fileBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        invoiceLink = file.getUrl();
    }

    // 3. Generate Public QR Link
    // We point this to our frontend's public route
    // e.g., https://your-app.com/asset-view/SBH1
    // Since we don't know the deployed frontend URL here, we'll store a partial path or placeholder
    // The frontend can construct the full URL. 
    // For the sheet, we store the ID.
    const qrData = id;

    const row = [
        id,
        data.machineName,
        data.serialNumber,
        data.purchaseDate,
        invoiceLink,
        data.currentServiceDate,
        data.nextServiceDate,
        data.remark,
        qrData,
        assetFolder.getUrl(),
        data.createdBy,
        timestamp,
        "Active"
    ];

    sheet.appendRow(row);

    // Send WhatsApp Notification (Optional)
    sendWhatsAppAlert(`🆕 New Asset Added:\nID: ${id}\nMachine: ${data.machineName}\nAdded By: ${data.createdBy}`);

    return {
        status: "success",
        message: "Asset Created Successfully",
        assetId: id,
        folderUrl: assetFolder.getUrl()
    };
}

function getAssets(filters) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data.shift(); // Remove headers

    // Map to object
    const assets = data.map(row => ({
        id: row[0],
        machineName: row[1],
        serialNumber: row[2],
        purchaseDate: row[3],
        invoiceLink: row[4],
        currentServiceDate: row[5],
        nextServiceDate: row[6],
        remark: row[7],
        qrLink: row[8],
        folderLink: row[9],
        createdBy: row[10],
        createdDate: row[11],
        status: row[12]
    }));

    return { status: "success", data: assets };
}

function getAssetDetails(id) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();

    // Find Row
    // Row contains ID at index 0
    const row = data.find(r => r[0] == id);
    if (!row) return { status: "error", message: "Asset Not Found" };

    // Get Service History from Drive
    // We can find the folder by ID or name? 
    // Better: We stored the folder link in row[9].
    // Let's use the Folder ID extracted from the link or searched.
    let history = [];
    try {
        const folderUrl = row[9];
        const folderId = folderUrl.match(/[-\w]{25,}/);
        if (folderId) {
            const folder = DriveApp.getFolderById(folderId[0]);
            const serviceFolders = folder.getFoldersByName("Service History");
            if (serviceFolders.hasNext()) {
                const hFolder = serviceFolders.next();
                const files = hFolder.getFiles();
                while (files.hasNext()) {
                    const file = files.next();
                    history.push({
                        name: file.getName(),
                        url: file.getUrl(),
                        date: file.getDateCreated(),
                        type: file.getMimeType()
                    });
                }
            }
        }
    } catch (e) {
        console.log("Error fetching drive history: " + e);
    }

    return {
        status: "success",
        data: {
            id: row[0],
            machineName: row[1],
            serialNumber: row[2],
            purchaseDate: row[3],
            invoiceLink: row[4],
            currentServiceDate: row[5],
            nextServiceDate: row[6],
            remark: row[7],
            folderLink: row[9],
            status: row[12],
            history: history
        }
    };
}

function getPublicAssetDetails(id) {
    // Read-only, limited fields
    const details = getAssetDetails(id);
    if (details.status === "error") return details;

    const d = details.data;
    return {
        status: "success",
        data: {
            id: d.id,
            machineName: d.machineName,
            purchaseDate: d.purchaseDate,
            nextServiceDate: d.nextServiceDate,
            lastRemark: d.remark,
            status: d.status
            // No sensitive links or internal data
        }
    };
}

function addServiceRecord(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const allData = sheet.getDataRange().getValues();

    // Find row index (1-based for getRange)
    const rowIndex = allData.findIndex(r => r[0] == data.id);
    if (rowIndex === -1) return { status: "error", message: "Asset Not Found" };

    const realRowIndex = rowIndex + 1; // 1-based

    // 1. Upload Service Invoice to Drive
    let fileUrl = "";
    if (data.serviceFile && data.serviceFileName) {
        try {
            const assetFolderUrl = allData[rowIndex][9];
            const assetFolderId = assetFolderUrl.match(/[-\w]{25,}/)[0];
            const assetFolder = DriveApp.getFolderById(assetFolderId);

            let serviceHistoryFolder;
            const historyFolders = assetFolder.getFoldersByName("Service History");
            if (historyFolders.hasNext()) {
                serviceHistoryFolder = historyFolders.next();
            } else {
                serviceHistoryFolder = assetFolder.createFolder("Service History");
            }

            // Create Date-Specific Subfolder? Or just file? USER asked for date folder.
            // "Service History/13-Feb-2026/service_invoice.pdf"
            const dateStr = formatDate(new Date());
            let dateFolder;
            const dateFolders = serviceHistoryFolder.getFoldersByName(dateStr);
            if (dateFolders.hasNext()) {
                dateFolder = dateFolders.next();
            } else {
                dateFolder = serviceHistoryFolder.createFolder(dateStr);
            }

            const blob = Utilities.newBlob(Utilities.base64Decode(data.serviceFile), data.serviceFileType, data.serviceFileName);
            const file = dateFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            fileUrl = file.getUrl();

        } catch (e) {
            return { status: "error", message: "Drive Upload Failed: " + e.toString() };
        }
    }

    // 2. Update Sheet (Next Service Date, Last Service Date, Remark)
    // Columns: Current Service Date (5), Next Service Date (6), Remark (7)
    // Indices: 5, 6, 7 (0-based from row array, so column 6, 7, 8)

    sheet.getRange(realRowIndex, 6).setValue(data.serviceDate); // Current Service Date
    sheet.getRange(realRowIndex, 7).setValue(data.nextServiceDate); // Next Service Date
    sheet.getRange(realRowIndex, 8).setValue(data.remark); // Remark
    sheet.getRange(realRowIndex, 13).setValue("Active"); // Reset Status

    // Send WhatsApp Note
    sendWhatsAppAlert(`🛠 Service Updated:\nAsset: ${data.id}\nDate: ${data.serviceDate}\nRemark: ${data.remark}`);

    return { status: "success", message: "Service Record Added" };
}


/* --- AUTOMATION & TRIGGERS --- */

function serviceReminder() {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const today = new Date();

    // Skip header
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const assetId = row[0];
        const nextServiceDate = new Date(row[6]);
        const machineName = row[1];

        if (!isValidDate(nextServiceDate)) continue;

        const diffTime = nextServiceDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Reminder Rules:
        // 20 days before
        if (diffDays === 20 || diffDays === 7 || diffDays === 1) {
            sendWhatsAppAlert(`🔔 Service Reminder:\nAsset: ${assetId} (${machineName})\nDue in: ${diffDays} days\nDate: ${formatDate(nextServiceDate)}`);

            // Mark status as "Due Soon" if not already
            sheet.getRange(i + 1, 13).setValue("Service Due");
        }
    }
}

/* --- UTILS --- */

function sendWhatsAppAlert(message, specificNumber) {
    const phone = specificNumber || CONFIG.WHATSAPP.ADMIN_PHONE;

    if (!phone) {
        console.log("⚠️ WhatsApp Alert Skipped: No Phone Number Configured. Message: " + message);
        return;
    }

    try {
        const payload = {
            username: CONFIG.WHATSAPP.USERNAME,
            password: CONFIG.WHATSAPP.PASS,
            receiver: phone,
            msg: message
        };

        // Construct Query String
        const queryString = Object.keys(payload)
            .map(key => key + '=' + encodeURIComponent(payload[key]))
            .join('&');

        const url = CONFIG.WHATSAPP.API_URL + '?' + queryString;

        const options = {
            method: 'get',
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const resText = response.getContentText();
        console.log("WhatsApp Response: " + resText);

        if (response.getResponseCode() !== 200) {
            console.error("WhatsApp API Error: " + resText);
        }

    } catch (e) {
        console.error("❌ Error sending WhatsApp: " + e.toString());
    }
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

function isValidDate(d) {
    return d instanceof Date && !isNaN(d);
}
