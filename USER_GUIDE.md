# SBH Asset Management System - User Guide

## Overview
Welcome to the upgraded SBH Asset Management System. This guide covers how to use the new features for tracking assets, managing lifecycles, and utilizing AI-driven repair intelligence.

## 1. Asset Management

### Adding a New Asset
1.  Navigate to **Assets** in the top menu.
2.  Click **"Add New Asset"**.
3.  Fill in the required details:
    - **Machine Name**: e.g., "Dell Latitude 5420"
    - **Category**: e.g., "Laptop", "Server"
    - **Purchase Info**: Cost, Date, Vendor (Critical for financial reports).
    - **Upload Invoice**: Attach the PDF/Image invoice.
4.  Click **"Register Asset"**. The system will generate a unique Asset ID (e.g., `SBH-1001`).

### Editing an Asset
1.  Go to **Asset Details** page for any asset.
2.  Click the **"Edit"** (Pencil) icon on the top right of the details card.
3.  Update fields as necessary and click **"Update Asset"**.
    - *Note: Asset ID cannot be changed.*

### Servicing & Maintenance
1.  On the **Asset Details** page, click **"+ Add Service Record"**.
2.  Enter:
    - **Service Date**: When the service happened.
    - **Next Due Date**: *Important for AI Urgency calculation.*
    - **Cost**: Cost of this specific service.
    - **Report**: Upload the service report PDF.
3.  Click **"Save Record"**. The AI will automatically update the Health Score.

## 2. Lifecycle Management (Replacement)

When an asset reaches end-of-life:
1.  Go to **Asset Details**.
2.  Click the **"Mark as Replaced"** button (Review section).
3.  Select Reason: "Beyond Repair", "Obsolete", etc.
4.  **Enter New Machine Details**: You can immediately register the replacement machine here.
5.  **Confirm**:
    - The OLD asset status becomes **"Replaced"**.
    - The NEW asset is created with status **"Active"**.
    - A link is created between them in the **History Timeline**.

## 3. Financial Intelligence

### Financial Reports
- Go to **Assets Panel** -> **Financial Analytics** tab.
- View charts for:
    - **Total Asset Value**
    - **Service Spend vs Cost** (ROI analysis)
    - **Expense Trends**

### Export Data
- In the **Asset List** tab, click **"Export"**.
- A CSV file will download with all currently filtered assets, including costs and status.

## 4. Advanced AI & Repair Intelligence (New!)

### AI Intelligence Panel
On any Asset Details page, switch to the **"AI Intelligence"** tab to see:
- **Health Score (0-100%)**:
    - 🟢 >80%: Healthy
    - 🟡 50-80%: Warning
    - 🔴 <50%: Critical
- **Urgency Meter**: How soon action is needed.
- **Smart Recommendations**: AI suggestions like "Inspect Cooling System" or "Plan Replacement".

### Specialized Dashboards
- **Director's View** (`/director`):
    - Strategic overview for management.
    - Identifies "Money Pits" (assets costing more to repair than replace).
- **Service Team Panel** (`/service-team`):
    - Operational view for technicians.
    - Lists **"Urgent Actions"** grouped by priority.

## 5. Mobile Experience
- The system is fully responsive.
- On mobile, the Asset List turns into **Smart Cards**.
- **Quick Scan**: Use the mobile camera to scan Asset QR codes (future update).

---
**Support**: For technical issues, contact the IT Admin.
