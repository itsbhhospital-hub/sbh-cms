/*
 * SBH Enterprise Assets Management System
 * Backend Script (Google Apps Script) - Phase 2: Financial & Lifecycle Intelligence
 * 
 * INSTRUCTIONS:
 * 1. If updating: Run `updateAssetsSheetStructure` to add new columns.
 * 2. If new: Run `setupAssetsSheet`.
 * 3. Deploy as Web App.
 */

const CONFIG = {
    SHEET_ID: "1yqxmBzj24Vv4IYc-qfWaTgdN6isV_G7DRcRwsCGxNKU", // Provided by USER
    DRIVE_FOLDER_ID: "1N5dy31gADHN7Ln5p7MTRAs6KMACpt2yj",      // Provided by USER
    SHEET_NAME: "data",
    WHATSAPP: {
        API_URL: "https://app.ceoitbox.com/message/new",
        USERNAME: "SBH HOSPITAL",
        PASS: "123456789",
        ADMIN_PHONE: "" // TODO: Enter Admin Phone Number for Alerts
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
        "Status",              // 12 (Active/Service Due/Retired/Dead/Replaced)
        "Vendor Name",         // 13 [NEW]
        "Vendor Contact",      // 14 [NEW]
        "Purchase Cost",       // 15 [NEW]
        "Warranty Expiry",     // 16 [NEW]
        "AMC Start",           // 17 [NEW]
        "AMC Expiry",          // 18 [NEW]
        "Parent ID",           // 19 [NEW] (If this is a replacement)
        "Replaced By ID",      // 20 [NEW] (If this asset is replaced)
        "Total Service Cost",  // 21 [NEW] (Sum of all service costs)
        "Warranty Type",       // 22 [NEW]
        "AMC Taken",           // 23 [NEW]
        "AMC Amount",          // 24 [NEW]
        "Location",            // 25 [NEW]
        "Department"           // 26 [NEW]
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
}

function updateAssetsSheetStructure() {
    // Run this if you already have the sheet and need to add new columns
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const headers = [
        "Vendor Name", "Vendor Contact", "Purchase Cost",
        "Warranty Expiry", "AMC Start", "AMC Expiry",
        "Parent ID", "Replaced By ID", "Total Service Cost",
        "Warranty Type", "AMC Taken", "AMC Amount", // NEW
        "Location", "Department" // NEW
    ];
    // Append these headers at column 14 (index 13+1) if they don't exist
    // flexible check needed in real deployment, but here just appending for update
    sheet.getRange(1, 14, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 14, 1, headers.length).setFontWeight("bold");
}

/* --- API HANDLER --- */

function doGet(e) { return handleRequest(e); }
function doPost(e) { return handleRequest(e); }

function handleRequest(e) {
    const lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const params = e.parameter;
        let payload = {};
        if (e.postData && e.postData.contents) {
            try { payload = JSON.parse(e.postData.contents); } catch (err) { payload = {}; }
        }
        const data = { ...params, ...payload };
        const action = data.action;
        let result;

        switch (action) {
            case "addAsset": result = addAsset(data); break;
            case "getAssets": result = getAssets(data); break;
            case "getAssetDetails": result = getAssetDetails(data.id); break;
            case "addServiceRecord": result = addServiceRecord(data); break;
            case "editAsset": result = editAsset(data); break;
            case "markAsReplaced": result = markAsReplaced(data); break;
            case "getPublicAssetDetails": result = getPublicAssetDetails(data.id); break;
            default: result = { status: "error", message: "Invalid Action" };
        }

        return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: "error", message: error.toString() })).setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}

/* --- CORE FUNCTIONS --- */

function generateAssetId(sheet) {
    const lastRow = sheet.getLastRow();
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
    let folderName = `${id} - ${data.machineName}`;
    if (data.parentId) folderName += ` (Rep. of ${data.parentId})`;

    const assetFolder = rootFolder.createFolder(folderName);
    const invoiceFolder = assetFolder.createFolder("Purchase Invoice");
    assetFolder.createFolder("Service History");

    // 2. Handle Purchase Invoice
    let invoiceLink = "";
    if (data.invoiceFile && data.invoiceName) {
        const fileBlob = Utilities.newBlob(Utilities.base64Decode(data.invoiceFile), data.invoiceType, data.invoiceName);
        const file = invoiceFolder.createFile(fileBlob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        invoiceLink = file.getUrl();
    }

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
        "Active",
        // New Fields
        data.vendorName || "",
        data.vendorContact || "",
        data.purchaseCost || 0,
        data.warrantyExpiry || "", // Auto-calculated in frontend
        data.amcStart || "",
        data.amcExpiry || "",
        data.parentId || "",
        "", // Replaced By ID
        0,   // Total Service Cost
        data.warrantyType || "", // NEW
        data.amcTaken || "No", // NEW
        data.amcAmount || 0, // NEW
        data.location || "", // NEW
        data.department || "" // NEW
    ];

    sheet.appendRow(row);

    // Notify
    let msg = `🆕 New Asset Added:\nID: ${id}\nMachine: ${data.machineName}\nLoc: ${data.location}\nCost: ₹${data.purchaseCost}`;
    if (data.parentId) msg += `\n(Replacement for ${data.parentId})`;
    sendWhatsAppAlert(msg);

    // TRIGGER AI UDPATE IMMEDIATELY for this ID (Optional, or wait for cron)
    // For now, we trust the cron or next read.

    return { status: "success", message: "Asset Created", assetId: id, folderUrl: assetFolder.getUrl() };
}

function editAsset(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const allData = sheet.getDataRange().getValues();

    // Find Row
    const rowIndex = allData.findIndex(r => r[0] == data.id);
    if (rowIndex === -1) return { status: "error", message: "Asset Not Found" };
    const realRowIndex = rowIndex + 1;

    // Update allowable fields
    if (data.machineName) sheet.getRange(realRowIndex, 2).setValue(data.machineName);
    if (data.serialNumber) sheet.getRange(realRowIndex, 3).setValue(data.serialNumber);
    if (data.purchaseDate) sheet.getRange(realRowIndex, 4).setValue(data.purchaseDate);
    if (data.nextServiceDate) sheet.getRange(realRowIndex, 7).setValue(data.nextServiceDate);
    if (data.remark) sheet.getRange(realRowIndex, 8).setValue(data.remark);
    if (data.vendorName) sheet.getRange(realRowIndex, 14).setValue(data.vendorName);
    if (data.vendorContact) sheet.getRange(realRowIndex, 15).setValue(data.vendorContact);
    if (data.purchaseCost) sheet.getRange(realRowIndex, 16).setValue(data.purchaseCost);
    if (data.warrantyExpiry) sheet.getRange(realRowIndex, 17).setValue(data.warrantyExpiry);
    if (data.amcStart) sheet.getRange(realRowIndex, 18).setValue(data.amcStart);
    if (data.amcExpiry) sheet.getRange(realRowIndex, 19).setValue(data.amcExpiry);

    // New Fields Editing
    if (data.warrantyType) sheet.getRange(realRowIndex, 23).setValue(data.warrantyType);
    if (data.amcTaken) sheet.getRange(realRowIndex, 24).setValue(data.amcTaken);
    if (data.amcAmount) sheet.getRange(realRowIndex, 25).setValue(data.amcAmount);
    if (data.location) sheet.getRange(realRowIndex, 26).setValue(data.location);
    if (data.department) sheet.getRange(realRowIndex, 27).setValue(data.department);

    return { status: "success", message: "Asset Updated Successfully" };
}

function markAsReplaced(data) {
    // data: { id: "SBH1", reason: "Dead", remark: "Motor failed", newMachineData: {...} }
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const allData = sheet.getDataRange().getValues();

    // 1. Find Old Asset
    const oldRowIndex = allData.findIndex(r => r[0] == data.id);
    if (oldRowIndex === -1) return { status: "error", message: "Old Asset Not Found" };
    const realOldRowIndex = oldRowIndex + 1;

    // 2. Create New Asset (Linked)
    const newAssetData = { ...data.newMachineData, parentId: data.id, createdBy: data.createdBy };
    const addResult = addAsset(newAssetData);
    if (addResult.status !== "success") return addResult;

    const newAssetId = addResult.assetId;

    // 3. Update Old Asset Status
    sheet.getRange(realOldRowIndex, 13).setValue("Replaced"); // Status -> Replaced
    sheet.getRange(realOldRowIndex, 21).setValue(newAssetId); // Replaced By ID

    // 4. Add "Replacement" Record to Service History of Old Asset
    addServiceRecord({
        id: data.id,
        serviceDate: new Date(),
        nextServiceDate: "", // No more service
        remark: `REPLACED by ${newAssetId}. Reason: ${data.reason}. ${data.remark}`,
        statusOverride: "Replaced" // Special flag
    });

    sendWhatsAppAlert(`⚠ ASSET REPLACED:\nOld: ${data.id} (Now Dead)\nNew: ${newAssetId} (Active)\nReason: ${data.reason}`);

    return { status: "success", message: "Replacement Processed", newAssetId: newAssetId };
}

/****************************************************************
 * 🧠 PHASE 4: ADVANCED AI & REPAIR INTELLIGENCE ENGINE
 ****************************************************************/

// 1. SETUP AI CACHE SHEET
function setupAICacheSheet() {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var sheet = ss.getSheetByName("asset_ai_cache");
    if (!sheet) {
        sheet = ss.insertSheet("asset_ai_cache");
        sheet.appendRow(["AssetID", "LastUpdated", "AI_Data_JSON"]);
        sheet.setFrozenRows(1);
    }
}

// 2. SETUP AI TRIGGER (Run manually once)
function setupAITrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'runAIAnalysis') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }
    ScriptApp.newTrigger('runAIAnalysis')
        .timeBased()
        .everyHours(6)
        .create();
}

// 3. CORE AI ANALYSIS ENGINE (FIXED BINDING)
function runAIAnalysis() {
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var assetSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    var aiSheet = ss.getSheetByName("asset_ai_cache");

    if (!aiSheet) { setupAICacheSheet(); aiSheet = ss.getSheetByName("asset_ai_cache"); }

    var assetsData = assetSheet.getDataRange().getValues();
    var headers = assetsData.shift();
    var assets = assetsData.map(row => {
        let obj = {};
        headers.forEach((header, i) => {
            obj[toCamelCase(header)] = row[i];
        });
        return obj;
    });

    var aiResults = [];
    var timestamp = new Date();

    assets.forEach(function (asset) {
        // FIX: Handle both 'id' and 'assetId' and 'Asset ID' from camelCase
        // "Asset ID" -> assetId
        var assetId = asset.assetId || asset.id || asset.AssetID;

        if (!assetId) return; // Skip if no ID found (data integrity issue)

        // A. Filter history 
        let history = [];
        try {
            const folderUrl = asset.folderLink;
            if (folderUrl) {
                const folderId = folderUrl.match(/[-\w]{25,}/);
                if (folderId) {
                    const folder = DriveApp.getFolderById(folderId[0]);
                    const serviceFolders = folder.getFoldersByName("Service History");
                    if (serviceFolders.hasNext()) {
                        const hFolder = serviceFolders.next();
                        const files = hFolder.getFiles();
                        while (files.hasNext()) {
                            const file = files.next();
                            const fileName = file.getName();
                            const dateMatch = fileName.match(/(\d{1,2}-\w{3}-\d{4})/);
                            const costMatch = fileName.match(/₹(\d+(\.\d+)?)/);
                            history.push({
                                serviceDate: dateMatch ? new Date(dateMatch[0]) : file.getDateCreated(),
                                remark: fileName,
                                cost: costMatch ? parseFloat(costMatch[1]) : 0
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Error fetching service history for AI: " + e);
        }

        // B. Calculate AI Scores
        var healthScore = calculateHealthScore(asset, history);
        var urgencyScore = calculateUrgencyScore(asset, history);
        var predictions = predictPartFailure(history);
        var recommendations = generateRecommendations(asset, history, healthScore, urgencyScore);

        var aiData = {
            healthScore: healthScore,
            urgencyScore: urgencyScore,
            predictions: predictions,
            recommendations: recommendations,
            lastAnalysis: timestamp
        };

        aiResults.push([assetId, timestamp, JSON.stringify(aiData)]);
    });

    // E. Update Cache Sheet 
    if (aiResults.length > 0) {
        if (aiSheet.getLastRow() > 1) {
            aiSheet.getRange(2, 1, aiSheet.getLastRow() - 1, 3).clearContent();
        }
        aiSheet.getRange(2, 1, aiResults.length, 3).setValues(aiResults);
    }
}

// --- AI HELPER FUNCTIONS ---

function calculateHealthScore(asset, history) {
    var score = 100;
    var ageYears = (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);

    // 1. Age Factor
    if (ageYears > 3) score -= (ageYears - 3) * 5;

    // 2. Repair Frequency (Last 6 months)
    var sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    var recentRepairs = history.filter(function (h) { return new Date(h.serviceDate) > sixMonthsAgo; }).length;
    score -= (recentRepairs * 10);

    // 3. Status Check
    if (asset.status === 'Service Due') score -= 15;
    if (asset.status === 'Overdue') score -= 25;
    if (asset.status === 'Retired' || asset.status === 'Replaced') score = 0;

    return Math.max(0, Math.round(score));
}

function calculateUrgencyScore(asset, history) {
    var score = 0;

    // 1. Overdue Service
    if (asset.status === 'Overdue') score += 40;
    if (asset.status === 'Service Due') score += 20;

    // 2. Recurring Issues
    if (history.length > 2) {
        var lastRemark = history[history.length - 1].remark.toLowerCase();
        var prevRemark = history[history.length - 2].remark.toLowerCase();
        if (lastRemark.length > 5 && prevRemark.includes(lastRemark)) score += 30;
    }

    // 3. Age Criticality
    var ageYears = (new Date() - new Date(asset.purchaseDate)) / (1000 * 60 * 60 * 24 * 365);
    if (ageYears > 7) score += 10;

    // 4. AMC Expiry Warning (New Intelligence)
    if (asset.amcExpiry && new Date(asset.amcExpiry) < new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000))) {
        score += 15; // Bump urgency if AMC expiring soon
    }

    return Math.min(100, Math.round(score));
}

function predictPartFailure(history) {
    var riskParts = [];
    var remarks = history.map(function (h) { return h.remark.toLowerCase(); }).join(" ");

    if (remarks.includes("fan") || remarks.includes("cooling") || remarks.includes("heat")) riskParts.push("Cooling System (Fan/Vent)");
    if (remarks.includes("power") || remarks.includes("voltage") || remarks.includes("shutdown")) riskParts.push("Power Supply Unit");
    if (remarks.includes("noise") || remarks.includes("vibration") || remarks.includes("rattle")) riskParts.push("Mechanical Bearings/Motor");
    if (remarks.includes("sensor") || remarks.includes("error code")) riskParts.push("Sensors/Control Board");

    return [...new Set(riskParts)];
}

function generateRecommendations(asset, history, health, urgency) {
    var recs = [];

    // 1. Repair vs Replace
    var totalRepairCost = history.reduce(function (sum, h) { return sum + (Number(h.cost) || 0); }, 0);
    if (asset.purchaseCost > 0 && totalRepairCost > (asset.purchaseCost * 0.6)) {
        recs.push({ type: 'CRITICAL', message: "Replacement Recommended: Repair costs exceed 60% of asset value." });
    } else if (health < 40) {
        recs.push({ type: 'WARNING', message: "Consider Replacement Planning: Asset health is critical." });
    }

    // 2. Immediate Actions
    if (urgency > 60) recs.push({ type: 'ACTION', message: "Urgent Repair/Service Required." });

    // 3. AMC Logic (Updated)
    if (asset.amcTaken === 'Yes') {
        if (asset.amcExpiry && new Date(asset.amcExpiry) < new Date()) {
            recs.push({ type: 'CRITICAL', message: "AMC EXPIRED. Renew Immediately." });
        } else if (asset.amcExpiry && new Date(asset.amcExpiry) < new Date(new Date().getTime() + (30 * 24 * 60 * 60 * 1000))) {
            recs.push({ type: 'WARNING', message: "AMC Expiring in < 30 Days." });
        }
    } else {
        if (!asset.amcExpiry || new Date(asset.amcExpiry) < new Date()) {
            if (history.length > 3) recs.push({ type: 'SUGGESTION', message: "Get AMC Coverage: High repair frequency detected." });
        }
    }

    return recs;
}

// 4. UPDATED GET ASSETS (Merges AI Data)
function getAssetsWithAI(filters) { // Renaming internal usage, exposed as getAssets
    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    var assetSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    var aiSheet = ss.getSheetByName("asset_ai_cache");

    var assets = getData(assetSheet);

    // Fetch AI Cache
    var aiMap = {};
    if (aiSheet) {
        var aiData = aiSheet.getDataRange().getValues();
        // Skip header
        for (var i = 1; i < aiData.length; i++) {
            try {
                aiMap[aiData[i][0]] = JSON.parse(aiData[i][2]);
            } catch (e) { /* ignore parse error */ }
        }
    }

    // Merge
    var merged = assets.map(function (asset) {
        // Fix: Header "Asset ID" becomes "assetID" via toCamelCase
        var assetId = asset.assetId || asset.id || asset.assetID || asset.AssetID;

        var ai = aiMap[assetId] || { healthScore: 100, urgencyScore: 0, predictions: [], recommendations: [], lastAnalysis: null };
        asset.aiHealthScore = ai.healthScore;
        asset.aiUrgencyScore = ai.urgencyScore;
        asset.aiPredictions = ai.predictions;
        asset.aiRecommendations = ai.recommendations;
        asset.aiLastAnalysis = ai.lastAnalysis;

        // Normalize ID for frontend
        asset.id = assetId;

        return asset;
    });

    return { status: "success", data: merged };
}

// Helper getData function (ensure it exists or is reused)
function getData(sheet) {
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var result = [];
    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
            var headerName = headers[j];
            // Convert specific date columns to ISO string for consistency
            if (headerName.includes("Date") || headerName.includes("Expiry") || headerName.includes("Start")) {
                obj[toCamelCase(headerName)] = row[j] ? new Date(row[j]).toISOString() : null;
            } else {
                obj[toCamelCase(headerName)] = row[j];
            }
        }
        result.push(obj);
    }
    return result;
}

function toCamelCase(str) {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index == 0 ? word.toLowerCase() : word.toUpperCase();
    }).replace(/\s+/g, '');
}

// Original getAssets function is replaced/modified to use getAssetsWithAI
function getAssets(filters) {
    return getAssetsWithAI(filters);
}

function getAssetDetails(id) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const row = data.find(r => r[0] == id);
    if (!row) return { status: "error", message: "Asset Not Found" };

    // Fetch History from Drive
    let history = [];

    // 1. Creation Event
    history.push({
        type: "event",
        name: "Asset Acquired",
        date: row[3] || row[11], // Purchase Date or Created Date
        details: `Purchased for ₹${row[15] || 0} from ${row[13] || "Unknown Vendor"}`
    });

    // 2. Drive Service Records
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
                        type: "service",
                        name: file.getName(),
                        url: file.getUrl(),
                        date: file.getDateCreated(),
                        fileType: file.getMimeType()
                    });
                }
            }
        }
    } catch (e) {
        console.log("Drive Error: " + e);
    }

    // 3. Replacement Event (if applicable)
    if (row[12] === "Replaced" && row[20]) {
        history.push({
            type: "alert",
            name: "Asset Replaced",
            date: new Date(), // Approximation if not tracked separately, or fetch from log if possible.
            details: `Replaced by Asset ID: ${row[20]}`
        });
    }

    // 4. Origin Event (if it's a replacement)
    if (row[19]) {
        history.push({
            type: "info",
            name: "Replacement Origin",
            date: row[3] || row[11],
            details: `This asset replaced Asset ID: ${row[19]}`
        });
    }

    // Sort by Date Descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
        status: "success",
        data: {
            id: row[0], machineName: row[1], serialNumber: row[2],
            purchaseDate: row[3], invoiceLink: row[4],
            currentServiceDate: row[5], nextServiceDate: row[6],
            remark: row[7], folderLink: row[9], status: row[12],
            vendorName: row[13], vendorContact: row[14],
            purchaseCost: row[15], warrantyExpiry: row[16],
            amcStart: row[17], amcExpiry: row[18],
            parentId: row[19], replacedById: row[20],
            totalServiceCost: row[21] || 0,
            history: history
        }
    };
}

function getPublicAssetDetails(id) {
    const details = getAssetDetails(id);
    if (details.status === "error") return details;
    const d = details.data;
    // Check if replaced
    let publicStatus = d.status;
    let replacementInfo = null;
    if (d.status === "Replaced" && d.replacedById) {
        replacementInfo = { newAssetId: d.replacedById };
    }

    return {
        status: "success",
        data: {
            id: d.id,
            machineName: d.machineName,
            purchaseDate: d.purchaseDate,
            nextServiceDate: d.nextServiceDate,
            lastRemark: d.remark,
            status: publicStatus,
            replacementInfo: replacementInfo
        }
    };
}

function addServiceRecord(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const allData = sheet.getDataRange().getValues();
    const rowIndex = allData.findIndex(r => r[0] == data.id);
    if (rowIndex === -1) return { status: "error", message: "Asset Not Found" };
    const realRowIndex = rowIndex + 1;

    // Upload Logic
    let fileUrl = "";
    if (data.serviceFile && data.serviceFileName) {
        try {
            const assetFolderUrl = allData[rowIndex][9];
            const assetFolderId = assetFolderUrl.match(/[-\w]{25,}/)[0];
            const assetFolder = DriveApp.getFolderById(assetFolderId);
            let serviceHistoryFolder;
            const historyFolders = assetFolder.getFoldersByName("Service History");
            if (historyFolders.hasNext()) serviceHistoryFolder = historyFolders.next();
            else serviceHistoryFolder = assetFolder.createFolder("Service History");

            // Create folder for year/month? Or just file. 
            // Phase 2: Create Date Folder: "14-Feb-2026 Service"
            const dateStr = formatDate(new Date(data.serviceDate));
            let cycleFolder = serviceHistoryFolder.createFolder(dateStr + (data.cost ? ` - ₹${data.cost}` : ""));

            const blob = Utilities.newBlob(Utilities.base64Decode(data.serviceFile), data.serviceFileType, data.serviceFileName);
            const file = cycleFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            fileUrl = file.getUrl();
        } catch (e) { console.log(e); }
    }

    // 2. Update Sheet (Next Service Date, Last Service Date, Remark, Status, Total Cost)
    // Columns: 
    // Current Service Date (5) -> Index 6
    // Next Service Date (6) -> Index 7
    // Remark (7) -> Index 8
    // Status (12) -> Index 13
    // Total Cost (21) -> Index 22

    sheet.getRange(realRowIndex, 6).setValue(data.serviceDate);
    sheet.getRange(realRowIndex, 7).setValue(data.nextServiceDate);
    sheet.getRange(realRowIndex, 8).setValue(data.remark);

    // Status Update
    if (data.statusOverride) {
        sheet.getRange(realRowIndex, 13).setValue(data.statusOverride);
    } else {
        sheet.getRange(realRowIndex, 13).setValue("Active");
    }

    // Cost Update
    if (data.cost) {
        let currentTotal = allData[rowIndex][21] || 0; // Index 21 is Column 22 (0-based array)
        let newTotal = parseFloat(currentTotal) + parseFloat(data.cost);
        sheet.getRange(realRowIndex, 22).setValue(newTotal);
    }

    sendWhatsAppAlert(`🛠 Service/Update:\nAsset: ${data.id}\nRemark: ${data.remark}\nCost: ₹${data.cost || 0}`);
    return { status: "success", message: "Service Record Added" };
}

/* --- UTILS --- */
function sendWhatsAppAlert(message, specificNumber) {
    const phone = specificNumber || CONFIG.WHATSAPP.ADMIN_PHONE;
    if (!phone) return;
    try {
        const payload = { username: CONFIG.WHATSAPP.USERNAME, password: CONFIG.WHATSAPP.PASS, receiver: phone, msg: message };
        const queryString = Object.keys(payload).map(key => key + '=' + encodeURIComponent(payload[key])).join('&');
        UrlFetchApp.fetch(CONFIG.WHATSAPP.API_URL + '?' + queryString, { method: 'get', muteHttpExceptions: true });
    } catch (e) {
        console.error(e);
    }
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}
