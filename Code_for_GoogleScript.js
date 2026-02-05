// 1. Open your Spreadsheet
// 2. Extensions > Apps Script
// 3. Paste this ENTIRE code into Code.gs (Delete old code)
// 4. Click Deploy > Manage Deployments > Edit (Pencil) > Version: New Version > Deploy
// 5. COPY the URL
// 6. TRIGGERS: Add a new trigger -> Function: onEditTrigger, Event Source: Spreadsheet, Event Type: On edit.

function onEditTrigger(e) {
    try {
        const sheet = e.source.getActiveSheet();
        if (sheet.getName() !== 'data') return;

        const range = e.range;
        const col = range.getColumn();
        const row = range.getRow();
        if (row <= 1) return; // Header

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const colMap = getColMap(headers);

        // If Status Changed to Closed/Resolved Manually
        if (col === colMap.Status) {
            const newStatus = e.value; // String value
            // Check if Closed or Resolved
            if (newStatus && (newStatus.toLowerCase() === 'closed' || newStatus.toLowerCase() === 'resolved')) {
                const ticketId = sheet.getRange(row, colMap.ID).getValue();
                const reportedBy = colMap.ReportedBy ? sheet.getRange(row, colMap.ReportedBy).getValue() : '';
                const resolver = colMap.ResolvedBy ? sheet.getRange(row, colMap.ResolvedBy).getValue() : 'Admin (Manual)';

                if (reportedBy && ticketId) {
                    sendResolutionNotification(ticketId, reportedBy, newStatus, resolver, 'Manual Sheet Update');
                    // Log to history
                    const historyCol = colMap.History;
                    if (historyCol) {
                        const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
                        const msg = `[${timestamp}] ${newStatus.toUpperCase()} (Manual Edit). Action by Sheet User.`;
                        const currentHist = sheet.getRange(row, historyCol).getValue();
                        sheet.getRange(row, historyCol).setValue(currentHist ? currentHist + '\n' + msg : msg);
                    }
                }
            }
        }
    } catch (err) {
        Logger.log(err.toString());
    }
}

function doGet(e) {
    const action = e.parameter.action;
    const sheetName = e.parameter.sheet || 'data';

    if (action === 'read') {
        return readData(sheetName);
    }
    return response('error', 'Invalid action');
}

function doPost(e) {
    try {
        const data = JSON.parse(e.postData.contents);
        const action = data.action;
        const payload = data.payload;

        if (action === 'createComplaint') return createComplaint(payload);
        if (action === 'registerUser') return registerUser(payload);
        if (action === 'updateUser') return updateUser(payload);
        if (action === 'deleteUser') return deleteUser(payload);
        if (action === 'changePassword') return changePassword(payload);
        if (action === 'updateComplaintStatus') return updateComplaintStatus(payload);

        return response('error', 'Invalid action');
    } catch (err) {
        return response('error', err.toString());
    }
}

// --- HELPER FUNCTIONS ---

function findCol(headers, target) {
    const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = norm(target);
    for (let i = 0; i < headers.length; i++) {
        const h = norm(headers[i]);
        if (h === t) return i + 1;
        // Partial matches for common variations
        if (t === 'id' && (
            h === 'tid' || h === 'ticketid' || h === 'complaintid' ||
            h === 'ticketno' || h === 'refno' || h === 'sno' ||
            h === 'complaintno' || h === 'ticket' || h === 'complaint' ||
            h === 'ref' || h === 'serialno' || h === 'srno' || h === 'uniqueid'
        )) return i + 1;

        if (t === 'mobile' && (h.includes('phone') || h.includes('mobile') || h === 'contact')) return i + 1;
        if (t === 'department' && (h === 'dept' || h === 'department')) return i + 1;
        if (t === 'reportedby' && (h === 'user' || h === 'username' || h === 'reportedby' || h === 'from')) return i + 1;
        if (t === 'resolveddate' && (h.includes('resolved') && h.includes('date'))) return i + 1;
        if (t === 'targetdate' && (h.includes('target') || h.includes('deadline'))) return i + 1;
    }
    return -1;
}

function getColMap(headers) {
    const map = {};
    const keys = ['ID', 'Date', 'Department', 'Description', 'Status', 'ReportedBy', 'ResolvedBy', 'Remark', 'Username', 'Password', 'Role', 'Mobile', 'Resolved Date', 'Unit', 'History', 'TargetDate', 'Reopened Date', 'Rating'];
    keys.forEach(k => {
        const idx = findCol(headers, k);
        if (idx !== -1) map[k] = idx;
    });
    return map;
}

function response(status, message, data) {
    return ContentService.createTextOutput(JSON.stringify({ status, message, data }))
        .setMimeType(ContentService.MimeType.JSON);
}

function readData(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return response('error', 'Sheet not found');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    return ContentService.createTextOutput(JSON.stringify(data.slice(1).map(row => {
        const obj = {};
        headers.forEach((h, i) => obj[h || ('Col' + i)] = row[i]);
        return obj;
    }))).setMimeType(ContentService.MimeType.JSON);
}

function createComplaint(payload) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data');
    if (!sheet) return response('error', 'Sheet "data" not found. Please create it.');

    // SMART HEADER DETECTION (Scan first 5 rows)
    let data = sheet.getDataRange().getValues();
    let headerRowIndex = 0;
    let headers = [];

    // Look for a row that contains 'Date' or 'Description' or 'Status'
    for (let r = 0; r < Math.min(data.length, 5); r++) {
        const rowStr = data[r].join(' ').toLowerCase();
        if (rowStr.includes('date') && (rowStr.includes('desc') || rowStr.includes('status'))) {
            headerRowIndex = r;
            headers = data[r];
            break;
        }
    }

    // If headers still empty, default to row 0
    if (headers.length === 0 && data.length > 0) headers = data[0];

    let colMap = getColMap(headers);

    // SELF HEALING: Check for essential columns independently and create if missing
    const essentialCols = ['Unit', 'History', 'TargetDate', 'Resolved Date', 'Rating'];
    let mappingUpdated = false;

    essentialCols.forEach(colName => {
        if (!colMap[colName]) {
            const currentLastCol = sheet.getLastColumn();
            sheet.getRange(headerRowIndex + 1, currentLastCol + 1).setValue(colName);
            mappingUpdated = true;
        }
    });

    // If we added columns, re-map
    if (mappingUpdated) {
        data = sheet.getDataRange().getValues();
        headers = data[headerRowIndex];
        colMap = getColMap(headers);
    }

    // Explicitly check for Rating column INDEPENDENTLY
    if (!colMap.Rating) {
        const lastCol = sheet.getLastColumn();
        sheet.getRange(headerRowIndex + 1, lastCol + 1).setValue('Rating');
        // Final Re-map
        data = sheet.getDataRange().getValues();
        headers = data[headerRowIndex];
        colMap = getColMap(headers);
    }

    // Final Check
    if (!colMap.ID) return response('error', 'Creating ID column failed. Headers found: ' + headers.join(', '));

    const nextRow = sheet.getLastRow() + 1;

    // Generate ID based on existing data
    // We only look at the specific ID column we mapped
    const existingIds = data.slice(headerRowIndex + 1).map(r => String(r[colMap.ID - 1] || '')).filter(id => id.startsWith('SBH'));

    let newId = 'SBH00001';
    if (existingIds.length > 0) {
        const lastId = existingIds[existingIds.length - 1];
        const match = lastId.match(/SBH(\d+)/);
        if (match) newId = 'SBH' + String(parseInt(match[1], 10) + 1).padStart(5, '0');
    }

    // FIX TIMEZONE: Use IST (GMT+5:30)
    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

    // Initial History
    const historyLog = `[${timestamp}] Ticket Created by ${payload.ReportedBy}`;

    const fields = {
        'ID': newId,
        'Date': timestamp,
        'Department': payload.Department,
        'Description': payload.Description,
        'Status': 'Open',
        'ReportedBy': payload.ReportedBy,
        'Unit': payload.Unit || '',
        'History': historyLog,
        'TargetDate': payload.TargetDate || ''
    };

    Object.keys(fields).forEach(f => {
        if (colMap[f]) sheet.getRange(nextRow, colMap[f]).setValue(fields[f]);
    });

    sendNewComplaintNotifications(payload.Department, newId, payload.ReportedBy, payload.Description);
    return response('success', 'Complaint Created', { id: newId });
}

function registerUser(payload) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('master');
    if (!sheet) return response('error', 'Sheet "master" not found');
    const headers = sheet.getDataRange().getValues()[0];
    const colMap = getColMap(headers);
    const nextRow = sheet.getLastRow() + 1;

    const fields = {
        'Username': payload.Username,
        'Password': payload.Password,
        'Role': payload.Role || 'user',
        'Status': payload.Status || 'Pending',
        'Department': payload.Department,
        'Mobile': payload.Mobile
    };

    Object.keys(fields).forEach(f => {
        if (colMap[f]) sheet.getRange(nextRow, colMap[f]).setValue(fields[f]);
    });

    if (payload.Status === 'Active' && payload.Mobile) {
        sendAccountApprovalNotification(payload.Username, payload.Mobile);
    }
    return response('success', 'User Registered');
}

function updateUser(payload) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('master');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colMap = getColMap(headers);
    if (!colMap.Username) return response('error', 'Username column not found');

    const target = (payload.OldUsername || payload.Username || '').toLowerCase().trim();
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
        const rowVal = String(data[i][colMap.Username - 1] || '').toLowerCase().trim();
        if (rowVal === target) {
            rowIndex = i + 1;
            break;
        }
    }
    if (rowIndex === -1) return response('error', 'User not found');

    Object.keys(payload).forEach(f => {
        if (colMap[f]) sheet.getRange(rowIndex, colMap[f]).setValue(payload[f]);
    });

    if (payload.Status === 'Active' && colMap.Mobile) {
        sendAccountApprovalNotification(payload.Username, sheet.getRange(rowIndex, colMap.Mobile).getValue());
    }
    return response('success', 'User Updated');
}

function updateComplaintStatus(payload) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('data');

    // SMART HEADER DETECTION (Scan first 5 rows)
    let data = sheet.getDataRange().getValues();
    let headerRowIndex = 0;
    let headers = [];

    for (let r = 0; r < Math.min(data.length, 5); r++) {
        const rowStr = data[r].join(' ').toLowerCase();
        if (rowStr.includes('date') && (rowStr.includes('desc') || rowStr.includes('status'))) {
            headerRowIndex = r;
            headers = data[r];
            break;
        }
    }
    if (headers.length === 0 && data.length > 0) headers = data[0];

    const colMap = getColMap(headers);

    // SELF HEALING: Ensure Rating column exists for updates too
    if (!colMap.Rating) {
        const lastCol = sheet.getLastColumn();
        sheet.getRange(headerRowIndex + 1, lastCol + 1).setValue('Rating');
        // Final Re-map
        const newData = sheet.getDataRange().getValues();
        const newHeaders = newData[headerRowIndex];
        // Merge new map
        const newCol = findCol(newHeaders, 'Rating');
        if (newCol !== -1) colMap.Rating = newCol;
    }

    if (!colMap.ID) return response('error', 'ID column not found for update. Headers: ' + headers.join(', '));

    let rowIndex = -1;
    const searchId = String(payload.ID || '').trim().toLowerCase(); // Normalize Payload ID

    // Search using the found ID column
    for (let i = headerRowIndex + 1; i < data.length; i++) {
        const cellId = String(data[i][colMap.ID - 1] || '').trim().toLowerCase(); // Normalize Cell ID
        if (cellId === searchId) {
            rowIndex = i + 1;
            break;
        }
    }
    if (rowIndex === -1) return response('error', 'Complaint not found. Searched for: "' + searchId + '"');

    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");
    let currentHistory = colMap.History ? String(sheet.getRange(rowIndex, colMap.History).getValue()) : '';
    let actionLog = '';

    // --- LOGIC HANDLING ---

    // Get current status early for logic and notifications
    const currentStatus = (rowIndex > 1 && colMap.Status) ? String(data[rowIndex - 1][colMap.Status - 1] || '').trim() : '';

    // CASE 1: EXTENSION
    if (payload.Status === 'Extend') {
        if (colMap.TargetDate && payload.TargetDate) {
            sheet.getRange(rowIndex, colMap.TargetDate).setValue(payload.TargetDate);
            actionLog = `[${timestamp}] Extended by ${payload.ResolvedBy} until ${payload.TargetDate}. Reason: ${payload.Remark}`;
        } else {
            actionLog = `[${timestamp}] Extended by ${payload.ResolvedBy}. Reason: ${payload.Remark} (No Target Date provided)`;
        }
    }

    // CASE 1.5: FORCE CLOSE (Admin ONLY)
    else if (payload.Status === 'Force Close') {
        const actionBy = payload.ResolvedBy || 'Admin';
        if (colMap.Status) sheet.getRange(rowIndex, colMap.Status).setValue('Closed');

        let label = "FORCE CLOSED";
        let statusLog = `[${timestamp}] ${label} by ${actionBy}`;
        if (payload.Remark) statusLog += `. Remark: ${payload.Remark}`;

        const separator = currentHistory ? '\n' : '';
        actionLog = currentHistory + separator + statusLog;
        if (colMap.History) sheet.getRange(rowIndex, colMap.History).setValue(actionLog);

        // Ensure Resolved Date is set if not already
        if (colMap['Resolved Date'] && !String(sheet.getRange(rowIndex, colMap['Resolved Date']).getValue()).trim()) {
            sheet.getRange(rowIndex, colMap['Resolved Date']).setValue(timestamp);
        }

        return response('success', 'Ticket Force Closed');
    }

    // CASE 2: RESOLUTION / CLOSURE / RE-OPEN
    else {
        const actionBy = payload.ResolvedBy || 'User';

        // Update STATUS
        if (colMap.Status && payload.Status) sheet.getRange(rowIndex, colMap.Status).setValue(payload.Status);

        // Update RESOLVER (Only if NOT already set)
        // This ensures the FIRST person to solve it stays as the Resolver.
        const existingResolver = colMap.ResolvedBy ? String(data[rowIndex - 1][colMap.ResolvedBy - 1] || '').trim() : '';
        if (colMap.ResolvedBy && (payload.Status === 'Closed' || payload.Status === 'Resolved') && !existingResolver) {
            sheet.getRange(rowIndex, colMap.ResolvedBy).setValue(actionBy);
        }

        let historyLines = [];

        // 1. Status Log (Only Open, Closed, Re-open)
        // Fix: Only log to history if Status actually CHANGED to prevent spam when rating
        if ((payload.Status === 'Open' || payload.Status === 'Closed') && payload.Status !== currentStatus) {
            const label = (payload.Status === 'Open' && currentStatus === 'Closed') ? 'RE-OPEN' : payload.Status.toUpperCase();
            let statusLog = `[${timestamp}] ${label} by ${actionBy}`;
            if (payload.Remark) statusLog += `. Remark: ${payload.Remark}`;
            historyLines.push(statusLog);
        }

        // 2. Rating Update (Main Sheet Column only, NOT journey log)
        if (colMap.Rating && payload.Rating) {

            // STRICT VALIDATION: Check if already rated in 'ratings' sheet
            if (isAlreadyRated(payload.ID)) {
                return response('error', 'Strict Architecture Rule: Rating already exists. You cannot rate twice.');
            }

            sheet.getRange(rowIndex, colMap.Rating).setValue(payload.Rating);
            // Log to dedicated Ratings sheet for analytics
            // BUG FIX: data is stale. If we just set the resolver in lines 330-336, we must use actionBy.
            let resolverName = colMap.ResolvedBy ? data[rowIndex - 1][colMap.ResolvedBy - 1] : '';
            if (!resolverName || resolverName === '') {
                // If it was empty in the sheet, we likely just set it to actionBy (if status is closed/resolved)
                resolverName = actionBy;
            }

            logRating({
                ID: payload.ID,
                Rating: payload.Rating,
                Remark: payload.Remark,
                Resolver: resolverName || 'Unknown',
                Reporter: actionBy
            });

            // SEND WHATSAPP NOTIFICATION TO RESOLVER
            // REMOVED as per User Request (Dashboard Only)
            // if (resolverName !== 'Unknown') {
            //      sendRatingNotification(payload.ID, resolverName, payload.Rating, payload.Remark, actionBy);
            // }
        }

        // Combine for History Column (Ticket Journey)
        // Only append if we actually have new relevant journey lines
        if (historyLines.length > 0) {
            const separator = currentHistory ? '\n' : '';
            actionLog = currentHistory + separator + historyLines.join('\n');
            if (colMap.History) sheet.getRange(rowIndex, colMap.History).setValue(actionLog);
        }

        // Capture Resolved Date (Only on first closure)
        if (payload.Status === 'Closed' && colMap['Resolved Date'] && !String(sheet.getRange(rowIndex, colMap['Resolved Date']).getValue()).trim()) {
            sheet.getRange(rowIndex, colMap['Resolved Date']).setValue(timestamp);
        }

        // Global Remark Update (Always show latest remark in main column)
        if (colMap.Remark && payload.Remark) sheet.getRange(rowIndex, colMap.Remark).setValue(payload.Remark);

        // --- NEW: LOG TO DEDICATED HISTORY SHEET ---
        logToAuditHistory({
            ID: payload.ID,
            Action: payload.Status === 'Extend' ? 'Extension' : payload.Status,
            By: actionBy || payload.ResolvedBy || 'User',
            Remark: payload.Remark,
            Rating: payload.Rating,
            OldStatus: currentStatus,
            NewStatus: payload.Status
        });

        // Notifications
        // 1. Resolution / Closure (To Reporter)
        // BUG FIX: now triggers if status becomes Closed OR Resolved, regardless of previous status
        // and ONLY if the status actually changed.
        if ((payload.Status === 'Closed' || payload.Status === 'Resolved') && payload.Status !== currentStatus) {
            const reportedByUser = colMap.ReportedBy ? data[rowIndex - 1][colMap.ReportedBy - 1] : 'User';
            sendResolutionNotification(payload.ID, reportedByUser, payload.Status, payload.ResolvedBy || 'Staff', payload.Remark);
        }

        // 2. Re-open Alert (To original Staff Resolver)
        if (payload.Status === 'Open' && currentStatus === 'Closed') {
            const originalStaff = colMap.ResolvedBy ? data[rowIndex - 1][colMap.ResolvedBy - 1] : null;
            if (originalStaff) {
                sendReopenNotification(payload.ID, originalStaff, payload.ResolvedBy || 'User', payload.Remark);

                // Set Reopened Date in sheet for Escalation Tracking
                if (colMap['Reopened Date']) {
                    sheet.getRange(rowIndex, colMap['Reopened Date']).setValue(new Date());
                }

                // [IMMUTABLE RATING FIX]
                // We DO NOT clear the rating anymore. 
                // "Write Once, Read Forever" rule by User.
                // The rating will persist even if the ticket is re-opened.

                // ESCALATION L3 NOTIFICATION (Notify L3 when someone re-opens)
                const L3 = getEscalationContact('L3');
                if (L3 && L3.mobile) {
                    const escMsg = `🚨 L3 ESCALATION: TICKET RE-OPENED\n\nTicket ID: #${payload.ID}\nOriginal Staff: ${originalStaff}\nReopened By: ${payload.ResolvedBy || 'User'}\nReason: ${payload.Remark || 'NA'}\n\nLink: https://sbh-cms.vercel.app/`;
                    sendWhatsApp(L3.mobile, escMsg);
                }
            }
        }
        // 3. Extension
        else if (payload.Status === 'Extend') {
            const reportedBy = colMap.ReportedBy ? data[rowIndex - 1][colMap.ReportedBy - 1] : '';
            sendExtensionNotification(payload.ID, reportedBy, payload.ResolvedBy, payload.TargetDate, payload.Remark);
        }

        // FORCE WRITE (Fix for "Rate button reappearing" - ensures data is saved before read)
        SpreadsheetApp.flush();

        return response('success', 'Status Updated');
    }
}

function deleteUser(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('master');
    const data = sheet.getDataRange().getValues();
    const usernameCol = data[0].indexOf('Username');

    for (let i = 1; i < data.length; i++) {
        if (String(data[i][usernameCol]).trim().toLowerCase() === String(payload.Username).trim().toLowerCase()) {
            sheet.deleteRow(i + 1);
            return response('success', 'User Deleted');
        }
    }
    return response('error', 'User not found');
}

function changePassword(payload) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('master');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colMap = getColMap(headers);

    if (!colMap.Username || !colMap.Password) return response('error', 'Critical columns missing');

    const targetUser = String(payload.Username || '').trim().toLowerCase();
    const oldPass = String(payload.OldPassword || '').trim();
    const newPass = String(payload.NewPassword || '').trim();

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][colMap.Username - 1] || '').trim().toLowerCase();

        if (rowUser === targetUser) {
            const currentPass = String(data[i][colMap.Password - 1] || '').trim();

            // Verify Old Password
            if (currentPass !== oldPass) {
                return response('error', 'Current Password Incorrect');
            }

            // Update New Password
            sheet.getRange(i + 1, colMap.Password).setValue(newPass);
            return response('success', 'Password Changed Successfully');
        }
    }
    return response('error', 'User not found');
}

// --- WhatsApp Notification Logic ---
const API_USERNAME = "SBH HOSPITAL";
const API_PASS = "123456789";
const BASE_URL = "https://app.ceoitbox.com/message/new";

function sendWhatsApp(number, message) {
    if (!number) return;
    try {
        let formattedNumber = String(number).trim().replace(/\D/g, '');
        const params = {
            'username': API_USERNAME,
            'password': API_PASS,
            'receiverMobileNo': formattedNumber,
            'receiverName': 'SBH User',
            'message': message
        };
        const queryString = Object.keys(params).map(key => key + '=' + encodeURIComponent(params[key])).join('&');
        const url = BASE_URL + "?" + queryString;
        UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    } catch (e) {
        Logger.log("Error: " + e.toString());
    }
}

// --- PREMIUM TEMPLATES ---

function sendAccountApprovalNotification(username, mobile) {
    const msg = `Dear ${username},\n\nWe are pleased to inform you that your account registration for the SBH CMS Portal has been APPROVED.\n\nLogin Credentials:\nUsername: ${username}\nPortal Link: https://sbh-cms.vercel.app/\n\nYou may now access the dashboard to report or manage tickets.\n\nRegards,\nSBH IT Administration`;
    sendWhatsApp(mobile, msg);
}

function sendNewComplaintNotifications(department, complaintId, reportedByUser, description) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];

    const colMap = {};
    headers.forEach((h, i) => colMap[h] = i);

    let userMobile = null;
    const staffMobiles = [];
    const targetDept = String(department || '').trim().toLowerCase();
    const reporterName = String(reportedByUser || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const u = String(row[colMap['Username']] || '').trim().toLowerCase();
        const dept = String(row[colMap['Department']] || '').trim().toLowerCase();
        const role = String(row[colMap['Role']] || '').trim().toLowerCase();
        const status = String(row[colMap['Status']] || '').trim().toLowerCase();
        const mobile = row[colMap['Mobile']];

        if (status !== 'active') continue;

        if (u === reporterName) userMobile = mobile;

        // Notify anyone in the target department OR any admin
        if (dept === targetDept || role === 'admin') {
            staffMobiles.push(mobile);
        }
    }

    if (userMobile) {
        const msg = `Dear ${reportedByUser},\n\nYour complaint has been successfully registered.\n\nTicket ID: ${complaintId}\nDepartment: ${department}\nDescription: ${description}\n\nOur team has been notified and will address this shortly.\nTrack status: https://sbh-cms.vercel.app/\n\nRegards,\nSBH Support Team`;
        sendWhatsApp(userMobile, msg);
    }

    [...new Set(staffMobiles)].forEach(mob => {
        if (mob != userMobile && mob) {
            const msg = `URGENT ALERT: New Incident Reported\n\nTicket ID: ${complaintId}\nDepartment: ${department}\nReported By: ${reportedByUser}\nIssue: ${description}\n\nPlease login to acknowledge and resolve: https://sbh-cms.vercel.app/\n\nSBH CMS Automation`;
            sendWhatsApp(mob, msg);
            Utilities.sleep(1000);
        }
    });
}

function sendResolutionNotification(complaintId, reportedByUser, status, resolvedBy, remark) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf('Username');
    const mobileCol = headers.indexOf('Mobile');

    let userMobile = null;
    const searchName = String(reportedByUser || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][usernameCol] || '').trim().toLowerCase();
        if (rowUser === searchName) {
            userMobile = data[i][mobileCol];
            break;
        }
    }

    if (userMobile) {
        const msg = `Dear ${reportedByUser},\n\nUpdate on Ticket #${complaintId}:\n\nStatus: ${status}\nAction By: ${resolvedBy}\nRemark: ${remark || 'N/A'}\n\nView details: https://sbh-cms.vercel.app/\n\nRegards,\nSBH Support Team`;
        sendWhatsApp(userMobile, msg);
    }
}

function sendExtensionNotification(complaintId, reportedByUser, extendedBy, newDate, reason) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf('Username');
    const mobileCol = headers.indexOf('Mobile');

    let userMobile = null;
    const searchName = String(reportedByUser || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][usernameCol] || '').trim().toLowerCase();
        if (rowUser === searchName) {
            userMobile = data[i][mobileCol];
            break;
        }
    }

    if (userMobile) {
        const msg = `Dear ${reportedByUser},\n\nRegarding Ticket #${complaintId}: The target resolution date has been extended.\n\nNew Target Date: ${newDate}\nReason: ${reason}\nUpdated By: ${extendedBy}\n\nWe apologize for the delay.\n\nRegards,\nSBH Support Team`;
        sendWhatsApp(userMobile, msg);
    }
}

function getEscalationContact(level) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('escalation_matrix');

    // Create sheet if not exists with placeholder data
    if (!sheet) {
        sheet = ss.insertSheet('escalation_matrix');
        sheet.appendRow(['Level', 'Name', 'Mobile', 'Role']);
        sheet.appendRow(['L1', 'Director Sir', '9999999999', 'Director']);
        sheet.appendRow(['L2', 'Operations Head', '8888888888', 'Ops Head']);
        sheet.appendRow(['L3', 'Staff Manager', '7777777777', 'Manager']);
        sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#fee2e2"); // Light red header
    }

    const data = sheet.getDataRange().getValues();
    const row = data.find(r => String(r[0]).trim().toUpperCase() === String(level).toUpperCase());
    return row ? { name: row[1], mobile: row[2] } : null;
}

function sendReopenNotification(ticketId, staffName, reopenedBy, remark) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf('Username');
    const mobileCol = headers.indexOf('Mobile');

    let staffMobile = null;
    const searchName = String(staffName || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][usernameCol] || '').trim().toLowerCase();
        if (rowUser === searchName) {
            staffMobile = data[i][mobileCol];
            break;
        }
    }

    if (staffMobile) {
        const msg = `🚨 RE-OPEN ALERT: Ticket #${ticketId}\n\nA ticket you previously closed has been RE-OPENED by ${reopenedBy}.\n\nRemark: ${remark || 'No reason provided'}\n\nPlease take immediate action: https://sbh-cms.vercel.app/\n\nSBH Support Automation`;
        sendWhatsApp(staffMobile, msg);
    }
}

function logToAuditHistory(data) {
    const sheetName = 'history';
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    // Create sheet if not exists
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
        sheet.appendRow(['Date', 'Ticket ID', 'Action', 'Performed By', 'Remarks', 'Old Status', 'New Status', 'Rating']);
        sheet.getRange("A1:H1").setFontWeight("bold").setBackground("#f0fdf4"); // Light green header
    }

    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
        timestamp,
        data.ID,
        data.Action,
        data.By,
        data.Remark || '',
        data.OldStatus || 'N/A',
        data.NewStatus || 'N/A',
        data.Rating || ''
    ]);
}

/**
 * Periodically check for re-opened tickets that are still pending.
 * Set this as a Time-Driven Trigger (every hour or 4 hours).
 */
function checkEscalationStatus() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('data');
    if (!sheet) return;

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const colMap = getColMap(headers);
    if (!colMap.Status || !colMap['Reopened Date']) return;

    const now = new Date();
    const L1 = getEscalationContact('L1');
    const L2 = getEscalationContact('L2');

    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const status = String(row[colMap.Status - 1] || '').trim();
        const reopDateStr = row[colMap['Reopened Date'] - 1];

        if (status === 'Open' && reopDateStr) {
            const reopDate = new Date(reopDateStr);
            const hoursDiff = (now - reopDate) / (1000 * 60 * 60);
            const ticketId = row[colMap.ID - 1];

            // 1. L1 Escalation (Director) - If pending > 24 hours
            if (hoursDiff >= 24) {
                if (L1 && L1.mobile) {
                    const msg = `🔥 CRITICAL L1 ESCALATION (24H+)\n\nDirector Sir, Ticket #${ticketId} is critically delayed.\n\nDescription: ${row[colMap.Description - 1]}\nResolver: ${row[colMap.ResolvedBy - 1]}\nReopened Status: UNRESOLVED\n\nIntervention required: https://sbh-cms.vercel.app/`;
                    sendWhatsApp(L1.mobile, msg);
                }
            }
            // 2. L2 Escalation (Ops Head) - If pending > 4 hours
            else if (hoursDiff >= 4) {
                if (L2 && L2.mobile) {
                    const msg = `⚠️ L2 MANAGEMENT ALERT (4H+)\n\nTicket #${ticketId} is pending for over 4 hours after re-opening.\n\nStaff: ${row[colMap.ResolvedBy - 1]}\n\nPlease review: https://sbh-cms.vercel.app/`;
                    sendWhatsApp(L2.mobile, msg);
                }
            }
        }
    }
}

function logRating(data) {
    const sheetName = 'ratings';
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

    // Create sheet if not exists
    if (!sheet) {
        sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
        sheet.appendRow(['Date', 'Ticket ID', 'Staff Name (Resolver)', 'Reporter Name', 'Rating', 'Feedback']);
        sheet.getRange("A1:F1").setFontWeight("bold").setBackground("#f3f4f6");
    }

    const timestamp = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd HH:mm:ss");

    sheet.appendRow([
        timestamp,
        data.ID,
        data.Resolver,  // Staff who solved it
        data.Reporter,  // User who rated it
        data.Rating,
        data.Remark || ''
    ]);
}

// HELPER: Check if a ticket has already been rated in the dedicated 'ratings' sheet
function isAlreadyRated(ticketId) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ratings');
    if (!sheet) return false;

    // Check cache/last rows optimization could be done, but for safety scan all
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return false; // Only headers

    // Find the 'Ticket ID' column index in 'ratings' sheet
    // Usually it is Col 2 (Index 1) based on logRating function: [Date, Ticket ID, ...]
    const headers = data[0];
    const idIndex = headers.indexOf('Ticket ID');

    if (idIndex === -1) return false;

    const targetId = String(ticketId).trim().toLowerCase();

    // Scan all rows
    for (let i = 1; i < data.length; i++) {
        const rowId = String(data[i][idIndex] || '').trim().toLowerCase();
        if (rowId === targetId) return true; // Found existing rating
    }
    return false;
}

function sendRatingNotification(ticketId, resolverName, rating, remark, raterName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf('Username');
    const mobileCol = headers.indexOf('Mobile');

    let staffMobile = null;
    const searchName = String(resolverName || '').trim().toLowerCase();

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][usernameCol] || '').trim().toLowerCase();
        if (rowUser === searchName) {
            staffMobile = data[i][mobileCol];
            break;
        }
    }

    if (staffMobile) {
        let stars = '';
        for (let k = 0; k < parseInt(rating); k++) stars += '⭐';

        const msg = `🎉 *New Rating Received*\n\nDear ${resolverName},\n\nUser ${raterName} has rated your service for Ticket #${ticketId}.\n\nRating: ${rating}/5 ${stars}\nFeedback: ${remark || 'No remark'}\n\nKeep up the good work!\n\nSBH CMS`;
        sendWhatsApp(staffMobile, msg);
    }
}
