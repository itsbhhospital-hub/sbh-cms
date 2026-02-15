/*
 * SBH Enterprise Assets Management System
 * Backend Script (Google Apps Script) - Phase 8: Master Repair & Sync Refinement
 * 
 * INSTRUCTIONS:
 * 1. If updating: Run `setupMasterRepair` to create new sheets.
 * 2. Deploy as Web App.
 */

const CONFIG = {
    SHEET_ID: "1yqxmBzj24Vv4IYc-qfWaTgdN6isV_G7DRcRwsCGxNKU", // Provided by USER
    DRIVE_FOLDER_ID: "1N5dy31gADHN7Ln5p7MTRAs6KMACpt2yj",      // Provided by USER
    SHEET_NAME: "data",
    WHATSAPP: {
        API_URL: "https://app.ceoitbox.com/message/new",
        USERNAME: "SBH HOSPITAL",
        PASS: "123456789",
        ADMIN_PHONE: "9644404741", // Admin Name: SBH Admin
        ADMIN_NAME: "SBH Admin"
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
    const map = getHeaderMap(sheet);
    const assetIdColIndex = map["Asset ID"] - 1;
    const data = sheet.getDataRange().getValues();

    let maxId = 0;
    // Skip header (row 0)
    for (let i = 1; i < data.length; i++) {
        const idStr = data[i][assetIdColIndex]; // e.g., "SBH15"
        if (idStr && typeof idStr === 'string' && idStr.startsWith('SBH')) {
            const numPart = parseInt(idStr.replace('SBH', ''), 10);
            if (!isNaN(numPart) && numPart > maxId) {
                maxId = numPart;
            }
        }
    }

    return "SBH" + (maxId + 1);
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

/* --- HELPER: DYNAMIC COLUMN MAPPING --- */
function getHeaderMap(sheet) {
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const map = {};
    headers.forEach((h, i) => { map[h] = i + 1; }); // Store 1-based index
    return map;
}

function editAsset(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const map = getHeaderMap(sheet); // Get dynamic map

    const allData = sheet.getDataRange().getValues();
    const assetIdColIndex = map["Asset ID"] - 1; // 0-based for array

    // Find Row
    const rowIndex = allData.findIndex(r => r[assetIdColIndex] == data.id);
    if (rowIndex === -1) return { status: "error", message: "Asset Not Found" };
    const realRowIndex = rowIndex + 1;

    // Helper to update cell
    const update = (headerName, val) => {
        if (map[headerName] && val !== undefined && val !== null) {
            sheet.getRange(realRowIndex, map[headerName]).setValue(val);
        }
    };

    // Update allowable fields
    update("Machine Name", data.machineName);
    update("Serial Number", data.serialNumber);
    update("Purchase Date", data.purchaseDate);
    update("Current Service Date", data.currentServiceDate); // Last Service Date
    update("Next Service Date", data.nextServiceDate);
    update("Remark", data.remark);
    update("Vendor Name", data.vendorName);
    update("Vendor Contact", data.vendorContact);
    update("Purchase Cost", data.purchaseCost);
    update("Warranty Expiry", data.warrantyExpiry);
    update("AMC Start", data.amcStart);
    update("AMC Expiry", data.amcExpiry);
    update("Warranty Type", data.warrantyType);
    update("AMC Taken", data.amcTaken);
    update("AMC Amount", data.amcAmount);
    update("Location", data.location);
    update("Department", data.department);

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
    const map = getHeaderMap(sheet);
    const allData = sheet.getDataRange().getValues();
    const assetIdColIndex = map["Asset ID"] - 1;

    const row = allData.find(r => r[assetIdColIndex] == id);
    if (!row) return { status: "error", message: "Asset Not Found" };

    // Helper to safely get value from row
    const getVal = (header) => {
        const idx = map[header];
        return idx ? row[idx - 1] : "";
    };

    // Fetch History from Drive AND Service Logs Sheet
    let history = [];

    // 1. Creation Event
    history.push({
        type: "event",
        name: "Asset Acquired",
        date: formatDate(new Date(getVal("Purchase Date") || getVal("Created Timestamp"))),
        details: `Purchased for ₹${getVal("Purchase Cost") || 0} from ${getVal("Vendor Name") || "Unknown Vendor"}`
    });

    // 2. Fetch from service_logs Sheet (NEW SYNC SOURCE)
    const logsSheet = ss.getSheetByName("service_logs");
    if (logsSheet) {
        const logs = logsSheet.getDataRange().getValues();
        // logs[0] = headers (Asset ID, Date, Type, Cost, Remark, File URL)
        for (let i = 1; i < logs.length; i++) {
            if (logs[i][0] == id) {
                history.push({
                    type: "service",
                    name: logs[i][2], // Type (Paid/AMC/Warranty)
                    date: formatDate(new Date(logs[i][1])),
                    details: logs[i][4] + (logs[i][3] ? ` (Cost: ₹${logs[i][3]})` : ""),
                    cost: logs[i][3],
                    fileUrl: logs[i][5] || ""
                });
            }
        }
    }

    // 3. Drive Service Records (Support for legacy files not in logs)
    // Note: detailed drive scanning might be slow, so we rely on logs for new stuff.
    // Keeping this lightweight or relying on logs is better. 
    // For now, let's keep it but catch errors.
    try {
        const folderUrl = getVal("Folder Link");
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
                        // Deduplication logic could go here, but for now we list them.
                        history.push({
                            type: "file",
                            name: "File Attachment",
                            url: file.getUrl(),
                            date: formatDate(file.getDateCreated()),
                            fileType: file.getMimeType(),
                            details: file.getName()
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.log("Drive Error: " + e);
    }

    // 4. Replacement Events
    if (getVal("Status") === "Replaced" && getVal("Replaced By ID")) {
        history.push({
            type: "alert",
            name: "Asset Replaced",
            date: formatDate(new Date()), // Approximation
            details: `Replaced by Asset ID: ${getVal("Replaced By ID")}`
        });
    }
    if (getVal("Parent ID")) {
        history.push({
            type: "info",
            name: "Replacement Origin",
            date: formatDate(new Date(getVal("Purchase Date"))),
            details: `This asset replaced Asset ID: ${getVal("Parent ID")}`
        });
    }

    // Sort by Date Descending
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Return Data Object
    return {
        status: "success",
        data: {
            id: row[assetIdColIndex],
            machineName: getVal("Machine Name"),
            serialNumber: getVal("Serial Number"),
            purchaseDate: formatDate(new Date(getVal("Purchase Date"))),
            invoiceLink: getVal("Invoice Link"),
            currentServiceDate: formatDate(new Date(getVal("Current Service Date"))),
            nextServiceDate: formatDate(new Date(getVal("Next Service Date"))),
            remark: getVal("Remark"),
            folderLink: getVal("Folder Link"),
            status: getVal("Status"),
            vendorName: getVal("Vendor Name"),
            vendorContact: getVal("Vendor Contact"),
            purchaseCost: getVal("Purchase Cost"),
            warrantyExpiry: formatDate(new Date(getVal("Warranty Expiry"))),
            amcStart: formatDate(new Date(getVal("AMC Start"))),
            amcExpiry: formatDate(new Date(getVal("AMC Expiry"))),
            parentId: getVal("Parent ID"),
            replacedById: getVal("Replaced By ID"),
            totalServiceCost: getVal("Total Service Cost") || 0,
            history: history,
            warrantyType: getVal("Warranty Type"),
            amcTaken: getVal("AMC Taken") || "No",
            amcAmount: getVal("AMC Amount") || 0,
            location: getVal("Location"),
            department: getVal("Department")
        }
    };
}

function getPublicAssetDetails(id) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const map = getHeaderMap(sheet);
    const allData = sheet.getDataRange().getValues();
    const assetIdColIndex = map["Asset ID"] - 1;

    const row = allData.find(r => r[assetIdColIndex] == id);
    if (!row) return { status: "error", message: "Asset Not Found" };

    const getVal = (header) => {
        const idx = map[header];
        return idx ? row[idx - 1] : "";
    };

    // Calculate Statuses
    const today = new Date();

    // Warranty Status
    let warrantyStatus = "Expired";
    let warrantyColor = "red";
    const wExpiryStr = getVal("Warranty Expiry");
    if (wExpiryStr) {
        const wExpiry = new Date(wExpiryStr);
        if (wExpiry > today) {
            const daysLeft = (wExpiry - today) / (1000 * 60 * 60 * 24);
            if (daysLeft < 30) { warrantyStatus = "Expiring Soon"; warrantyColor = "orange"; }
            else { warrantyStatus = "Active"; warrantyColor = "green"; }
        }
    } else {
        warrantyStatus = "Not Applicable";
        warrantyColor = "gray";
    }

    // AMC Status
    let amcStatus = "Not Taken";
    let amcColor = "gray";
    if (getVal("AMC Taken") === "Yes") {
        const aExpiryStr = getVal("AMC Expiry");
        if (aExpiryStr) {
            const aExpiry = new Date(aExpiryStr);
            if (aExpiry < today) { amcStatus = "Expired"; amcColor = "red"; }
            else {
                const daysLeft = (aExpiry - today) / (1000 * 60 * 60 * 24);
                if (daysLeft < 30) { amcStatus = "Expiring Soon"; amcColor = "orange"; }
                else { amcStatus = "Active"; amcColor = "green"; }
            }
        }
    }

    // Replacement Info
    let replacementInfo = null;
    if (getVal("Status") === "Replaced" && getVal("Replaced By ID")) {
        replacementInfo = { newAssetId: getVal("Replaced By ID") };
    }

    return {
        status: "success",
        data: {
            id: row[assetIdColIndex],
            machineName: getVal("Machine Name"),
            serialNumber: getVal("Serial Number"),
            department: getVal("Department"), // NEW
            location: getVal("Location"),     // NEW
            status: getVal("Status"),
            installDate: formatDate(new Date(getVal("Purchase Date"))),
            warrantyStatus: warrantyStatus,
            warrantyColor: warrantyColor,
            amcStatus: amcStatus,
            amcColor: amcColor,
            nextService: formatDate(new Date(getVal("Next Service Date"))),
            replacedById: getVal("Replaced By ID"),
            replacementInfo: replacementInfo
        }
    };
}

function addServiceRecord(data) {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const map = getHeaderMap(sheet); // Dynamic Map
    const allData = sheet.getDataRange().getValues();
    const assetIdColIndex = map["Asset ID"] - 1;

    // Find Row
    const rowIndex = allData.findIndex(r => r[assetIdColIndex] == data.id);
    if (rowIndex === -1) return { status: "error", message: "Asset Not Found" };
    const realRowIndex = rowIndex + 1;

    // 1. Upload Logic (Existing - Unchanged mostly)
    let fileUrl = "";
    if (data.serviceFile && data.serviceFileName) {
        try {
            const assetFolderUrl = allData[rowIndex][map["Folder Link"] - 1];
            const assetFolderId = assetFolderUrl.match(/[-\w]{25,}/)[0];
            const assetFolder = DriveApp.getFolderById(assetFolderId);
            let serviceHistoryFolder;
            const historyFolders = assetFolder.getFoldersByName("Service History");
            if (historyFolders.hasNext()) serviceHistoryFolder = historyFolders.next();
            else serviceHistoryFolder = assetFolder.createFolder("Service History");

            const dateStr = formatDate(new Date(data.serviceDate));
            let cycleFolder = serviceHistoryFolder.createFolder(dateStr + (data.cost ? ` - ₹${data.cost}` : ""));

            const blob = Utilities.newBlob(Utilities.base64Decode(data.serviceFile), data.serviceFileType, data.serviceFileName);
            const file = cycleFolder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            fileUrl = file.getUrl();
        } catch (e) { console.log(e); }
    }

    // 2. Update Asset Sheet using Map
    const update = (headerName, val) => {
        if (map[headerName] && val !== undefined && val !== null && val !== "") {
            sheet.getRange(realRowIndex, map[headerName]).setValue(val);
        }
    };

    update("Current Service Date", data.serviceDate);
    update("Next Service Date", data.nextServiceDate);
    update("Remark", data.remark); // Update last remark

    // Status Update
    if (data.statusOverride) {
        update("Status", data.statusOverride);
    } else {
        update("Status", "Active");
    }

    // Cost Update (Total Service Cost)
    if (data.cost) {
        const totalCostColIdx = map["Total Service Cost"] - 1;
        let currentTotal = allData[rowIndex][totalCostColIdx] || 0;
        let newTotal = parseFloat(currentTotal) + parseFloat(data.cost);
        sheet.getRange(realRowIndex, map["Total Service Cost"]).setValue(newTotal);
    }

    // 3. LOG TO 'service_logs' SHEET (Mapped)
    let logsSheet = ss.getSheetByName("service_logs");
    if (!logsSheet) {
        logsSheet = ss.insertSheet("service_logs");
        logsSheet.appendRow(["Asset ID", "Service Date", "Type", "Cost", "Remark", "File URL"]);
        logsSheet.setFrozenRows(1);
        logsSheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }

    logsSheet.appendRow([
        data.id,
        data.serviceDate,
        data.serviceType || "Paid", // Default to Paid if not provided
        data.cost || 0,
        data.remark,
        fileUrl
    ]);

    sendWhatsAppAlert(`🛠 Service/Update:\nAsset: ${data.id}\nType: ${data.serviceType || "Paid"}\nCost: ₹${data.cost || 0}`);
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

/****************************************************************
 * 🚀 PHASE 8: MASTER REPAIR SETUP
 ****************************************************************/

function setupMasterRepair() {
    setupMasterUpgrade(); // Dept Master
    // Ensure Service Logs Sheet
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    let logsSheet = ss.getSheetByName("service_logs");
    if (!logsSheet) {
        logsSheet = ss.insertSheet("service_logs");
        logsSheet.appendRow(["Asset ID", "Service Date", "Type", "Cost", "Remark", "File URL"]);
        logsSheet.setFrozenRows(1);
        logsSheet.getRange(1, 1, 1, 6).setFontWeight("bold");
    }
}

function setupMasterUpgrade() {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);

    // 1. Create Department Master Sheet
    let deptSheet = ss.getSheetByName("department_master");
    if (!deptSheet) {
        deptSheet = ss.insertSheet("department_master");
        const headers = ["Department Name", "Person Name", "Mobile Number"];
        deptSheet.appendRow(headers);
        deptSheet.setFrozenRows(1);
        deptSheet.getRange(1, 1, 1, 3).setFontWeight("bold");

        // Default Entries
        const defaults = [
            ["Accounts", "abc", "9644404741"],
            ["HR", "abc", "9644404741"],
            ["Admin", "abc", "9644404741"],
            ["IT", "abc", "9644404741"],
            ["Operations", "abc", "9644404741"],
            ["Sonography", "abc", "9644404741"],
            ["Doctors", "abc", "9644404741"],
            ["Director Sir", "abc", "9644404741"],
            ["La vista", "abc", "9644404741"],
            ["Reception", "abc", "9644404741"],
            ["Housekeeping", "abc", "9644404741"],
            ["Maintenance", "abc", "9644404741"],
            ["Nursing", "abc", "9644404741"],
            ["CRM", "abc", "9644404741"],
            ["ICU", "abc", "9644404741"],
            ["NICU", "abc", "9644404741"],
            ["OT", "abc", "9644404741"],
            ["Emergency", "abc", "9644404741"],
            ["IPD", "abc", "9644404741"],
            ["OPD", "abc", "9644404741"]
        ];
        deptSheet.getRange(2, 1, defaults.length, 3).setValues(defaults);
    }
}

// 5. SETUP DAILY TRIGGER (Run manually once)
function setupDailyTrigger() {
    var triggers = ScriptApp.getProjectTriggers();
    for (var i = 0; i < triggers.length; i++) {
        if (triggers[i].getHandlerFunction() === 'checkDailyReminders') {
            ScriptApp.deleteTrigger(triggers[i]);
        }
    }
    ScriptApp.newTrigger('checkDailyReminders')
        .timeBased()
        .everyDays(1)
        .atHour(9) // Run at 9 AM
        .create();
}

// Daily Trigger Logic
function checkDailyReminders() {
    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const assetSheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const deptSheet = ss.getSheetByName("department_master");

    const assets = getData(assetSheet);
    const departments = deptSheet.getDataRange().getValues();
    // Create Map: DeptName -> Mobile
    const deptMap = {};
    for (let i = 1; i < departments.length; i++) {
        if (departments[i][0]) deptMap[departments[i][0].toLowerCase()] = departments[i][2];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const L1_PHONE = "9425616267"; // Director
    const L2_PHONE = "9644404741"; // Officer

    assets.forEach(asset => {
        if (asset.status === "Retired" || asset.status === "Replaced" || asset.status === "Dead") return;

        // --- SERVICE LOGIC ---
        // Rule: Due if 6 months passed since last service
        // Logic: specific date check.
        let lastService = asset.currentServiceDate ? new Date(asset.currentServiceDate) : (asset.purchaseDate ? new Date(asset.purchaseDate) : null);
        let nextServiceDue = null;

        if (lastService) {
            nextServiceDue = new Date(lastService);
            nextServiceDue.setMonth(nextServiceDue.getMonth() + 6);
        } else {
            // Fallback if no dates: maybe use created date?
            // If completely empty, skip service checks
        }

        if (nextServiceDue) {
            nextServiceDue.setHours(0, 0, 0, 0);
            const diffTime = nextServiceDue - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // 1. Service Due Soon (20 days before)
            if (diffDays <= 20 && diffDays >= 0) {
                // Determine Phone
                const deptPhone = deptMap[(asset.department || "").toLowerCase()] || L2_PHONE;
                const msg = `⚠️ SERVICE REMINDER\nAsset: ${asset.id}\nMachine: ${asset.machineName}\nDept: ${asset.department}\nDue Date: ${formatDate(nextServiceDue)}\n\nSBH Group Of Hospitals\nAutomated Generated`;

                // Send Daily? Yes.
                sendWhatsAppAlert(msg, deptPhone);
            }

            // 2. Service Overdue (Expired)
            if (diffDays < 0) {
                const deptPhone = deptMap[(asset.department || "").toLowerCase()] || L2_PHONE;
                const msg = `🚨 SERVICE OVERDUE ALERT\nAsset: ${asset.id}\nImmediate Action Required.\nDue was: ${formatDate(nextServiceDue)}\n\nSBH Group Of Hospitals\nAutomated Generated`;
                sendWhatsAppAlert(msg, deptPhone);

                // ESCALATION
                const overdueDays = Math.abs(diffDays);
                if (overdueDays === 10) {
                    sendWhatsAppAlert(`escalation: L2 Officer Alert\nService Overdue 10 Days\nAsset: ${asset.id}`, L2_PHONE);
                }
                if (overdueDays === 15) {
                    sendWhatsAppAlert(`CRITICAL ESCALATION: L1 Director Alert\nService Overdue 15 Days\nAsset: ${asset.id}`, L1_PHONE);
                }
            }
        }

        // --- AMC LOGIC ---
        if (asset.amcTaken === "Yes" && asset.amcExpiry) {
            const amcExpiry = new Date(asset.amcExpiry);
            amcExpiry.setHours(0, 0, 0, 0);
            const diffTime = amcExpiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // 1. Expiring Soon (30 days)
            if (diffDays <= 30 && diffDays >= 0) {
                const deptPhone = deptMap[(asset.department || "").toLowerCase()] || L2_PHONE;
                const msg = `⏳ AMC RENEWAL REMINDER\nAsset: ${asset.id}\nAMC Expire Date: ${formatDate(amcExpiry)}\n\nSBH Group Of Hospitals\nAutomated Generated`;
                sendWhatsAppAlert(msg, deptPhone);
            }

            // 2. Expired
            if (diffDays < 0) {
                const deptPhone = deptMap[(asset.department || "").toLowerCase()] || L2_PHONE;
                const msg = `⛔ AMC EXPIRED ALERT\nAsset: ${asset.id}\nExpired on: ${formatDate(amcExpiry)}\n\nSBH Group Of Hospitals`;
                sendWhatsAppAlert(msg, deptPhone);

                // Escalation
                const overdueDays = Math.abs(diffDays);
                if (overdueDays === 10) sendWhatsAppAlert(`Escalation L2: AMC Expired 10 Days\nAsset: ${asset.id}`, L2_PHONE);
                if (overdueDays === 15) sendWhatsAppAlert(`CRITICAL L1: AMC Expired 15 Days\nAsset: ${asset.id}`, L1_PHONE);
            }
        }
    });
}

function formatDate(date) {
    if (!date) return "";
    const d = new Date(date);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${d.getDate()}-${months[d.getMonth()]}-${d.getFullYear()}`;
}
