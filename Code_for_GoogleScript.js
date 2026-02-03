// 1. Open your Spreadsheet
// 2. Extensions > Apps Script
// 3. Paste this ENTIRE code into Code.gs (Delete old code)
// 4. Click Deploy > Manage Deployments > Edit (Pencil) > Version: New Version > Deploy
// 5. COPY the URL

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
        if (action === 'updateComplaintStatus') return updateComplaintStatus(payload);

        return response('error', 'Invalid action');
    } catch (err) {
        return response('error', err.toString());
    }
}

// --- HELPER FUNCTIONS ---

function response(status, message, data) {
    const result = {
        status: status,
        message: message,
        data: data
    };
    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function readData(sheetName) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) return response('error', 'Sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map(row => {
        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = row[i];
        });
        return obj;
    });

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function createComplaint(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('data');
    if (!sheet) return response('error', 'Sheet "data" not found');

    sheet.appendRow([
        payload.ID,
        payload.Date,
        payload.Department,
        payload.Description,
        payload.ReportedBy,
        'Open', // Initial Status
        '', // ResolvedBy
        ''  // Remark
    ]);

    // Send Notification
    sendNewComplaintNotifications(payload.Department, payload.ID, payload.ReportedBy, payload.Description);

    return response('success', 'Complaint Created');
}

function registerUser(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('master');
    if (!sheet) return response('error', 'Sheet "master" not found');

    sheet.appendRow([
        payload.Username,
        payload.Password,
        payload.Role, // 'user', 'admin', 'manager'
        payload.Status, // 'Pending', 'Active'
        payload.Department,
        payload.Mobile
    ]);

    return response('success', 'User Registered');
}

function updateComplaintStatus(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('data');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Find Column Indices
    const idCol = headers.indexOf('ID');
    const statusCol = headers.indexOf('Status');
    const resolvedByCol = headers.indexOf('ResolvedBy');
    const remarkCol = headers.indexOf('Remark');
    const reportedByCol = headers.indexOf('ReportedBy');

    if (idCol === -1) return response('error', 'ID column missing');

    for (let i = 1; i < data.length; i++) {
        if (data[i][idCol] == payload.ID) {
            // Update Rows (1-indexed)
            if (statusCol !== -1) sheet.getRange(i + 1, statusCol + 1).setValue(payload.Status);
            if (resolvedByCol !== -1) sheet.getRange(i + 1, resolvedByCol + 1).setValue(payload.ResolvedBy);
            if (remarkCol !== -1) sheet.getRange(i + 1, remarkCol + 1).setValue(payload.Remark);

            // Notify
            const reportedBy = data[i][reportedByCol];
            sendResolutionNotification(payload.ID, reportedBy, payload.Status, payload.ResolvedBy, payload.Remark);

            return response('success', 'Complaint Updated');
        }
    }
    return response('error', 'Complaint ID not found');
}

function updateUser(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('master');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    // Map headers
    const colMap = {};
    headers.forEach((h, i) => colMap[h] = i + 1);

    let rowIndex = -1;
    // Find user by Username (or OldUsername if renaming)
    const targetUsername = payload.OldUsername || payload.Username;

    const usernameCol = colMap['Username'];
    if (!usernameCol) return response('error', 'Username column missing');

    for (let i = 1; i < data.length; i++) {
        // Robust Compare: Convert to string and trim
        const rowUser = String(data[i][usernameCol - 1]).trim();
        const searchUser = String(targetUsername).trim();

        if (rowUser === searchUser) {
            rowIndex = i + 1;
            break;
        }
    }

    if (rowIndex === -1) return response('error', 'User not found');

    // Safe Update
    const safeUpdate = (field) => {
        if (payload[field] !== undefined) {
            // If column doesn't exist, create it 
            if (!colMap[field]) {
                const newCol = sheet.getLastColumn() + 1;
                sheet.getRange(1, newCol).setValue(field);
                colMap[field] = newCol;
            }
            sheet.getRange(rowIndex, colMap[field]).setValue(payload[field]);
        }
    };

    safeUpdate('Username');
    safeUpdate('Role');
    safeUpdate('Status');
    safeUpdate('Password');
    safeUpdate('Department');
    safeUpdate('Mobile');

    // --- APPROVAL NOTIFICATION ---
    if (payload.Status === 'Active') {
        const mobileCol = colMap['Mobile'];
        let userMobile = '';
        if (mobileCol) {
            userMobile = sheet.getRange(rowIndex, mobileCol).getValue();
        }

        if (userMobile) {
            sendAccountApprovalNotification(payload.Username, userMobile);
        }
    }

    return response('success', 'User Updated');
}

function deleteUser(payload) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('master');
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const usernameCol = headers.indexOf('Username');

    if (usernameCol === -1) return response('error', 'Username column missing');

    for (let i = 1; i < data.length; i++) {
        const rowUser = String(data[i][usernameCol]).trim();
        const searchUser = String(payload.Username).trim();

        if (rowUser === searchUser) {
            sheet.deleteRow(i + 1);
            return response('success', 'User Deleted');
        }
    }
    return response('error', 'User not found');
}

// --- NOTIFICATION HELPERS ---

function sendAccountApprovalNotification(username, mobile) {
    const msg = `Welcome to SBH Group of Hospitals! 🏥\n\nYour account has been successfully APPROVED by the Admin. ✅\n\nYou can now login to the CMS portal using your credentials.\nUsername: ${username}\n\n- SBH IT Team`;
    sendWhatsApp(mobile, msg);
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

        const resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
        Logger.log("WhatsApp Response (" + formattedNumber + "): " + resp.getContentText());
    } catch (e) {
        Logger.log("WhatsApp Error (" + number + "): " + e.toString());
    }
}

function testWhatsAppConnection() {
    sendWhatsApp("9876543210", "Test Message from SBH CMS");
}

function sendNewComplaintNotifications(department, complaintId, reportedByUser, description) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('master');
    const data = masterSheet.getDataRange().getValues();
    const headers = data[0];

    const colMap = {};
    headers.forEach((h, i) => colMap[h] = i);

    if (colMap['Mobile'] === undefined) {
        Logger.log("WARNING: 'Mobile' column missing in master sheet. Notifications skipped.");
        return;
    }

    let userMobile = null;
    const staffMobiles = [];

    const targetDept = String(department).trim().toLowerCase();
    const reporterName = String(reportedByUser).trim();

    for (let i = 1; i < data.length; i++) {
        const row = data[i];

        let u = '';
        if (colMap['Username'] !== undefined) u = String(row[colMap['Username']] || '').trim();

        let dept = '';
        if (colMap['Department'] !== undefined) dept = String(row[colMap['Department']] || '').trim().toLowerCase();

        let role = '';
        if (colMap['Role'] !== undefined) role = String(row[colMap['Role']] || '').trim().toLowerCase();

        let status = '';
        if (colMap['Status'] !== undefined) status = row[colMap['Status']];

        const rawMobile = row[colMap['Mobile']];

        if (!rawMobile) continue;

        const mobile = String(rawMobile).trim();

        if (u === reporterName) {
            userMobile = mobile;
        }

        const isDeptMatch = (dept === targetDept);
        const isManager = (role === 'manager');
        const isAdmin = (role === 'admin');

        if ((isDeptMatch && isManager && status === 'Active') || (isAdmin && status === 'Active')) {
            staffMobiles.push(mobile);
        }
    }

    if (userMobile) {
        const msg = `Hello ${reportedByUser}, Your complaint (ID: ${complaintId}) regarding ${department} has been registered successfully.\n\nDescription: ${description}\n\n- SBH Group Of Hospitals`;
        sendWhatsApp(userMobile, msg);
    }

    const uniqueStaff = [...new Set(staffMobiles)];
    uniqueStaff.forEach(mob => {
        if (String(mob) !== String(userMobile)) {
            const msg = `🚨 NEW COMPLAINT\nID: ${complaintId}\nDept: ${department}\nFrom: ${reportedByUser}\n\n"${description}"\n\nPlease resolve ASAP.\n- SBH Admin System`;
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

    if (usernameCol === -1 || mobileCol === -1) return;

    let userMobile = null;
    for (let i = 1; i < data.length; i++) {
        if (String(data[i][usernameCol]) === reportedByUser) {
            userMobile = data[i][mobileCol];
            break;
        }
    }

    if (userMobile) {
        const msg = `Hello ${reportedByUser}, Your complaint (ID: ${complaintId}) has been ${status} by ${resolvedBy}.\nRemark: ${remark || 'No remark'}\n- SBH Hospital`;
        sendWhatsApp(userMobile, msg);
    }
}
