# SBH Enterprise Assets Management System

A comprehensive Asset Management solution integrated with Google Sheets and Google Drive, built using React + Vite and Google Apps Script.

## Features

### 1. Asset Management
- **Add Assets**: Create new assets with Invoice upload (automatically saved to Google Drive).
- **Edit Assets**: Update machine details, costs, and vendor info.
- **Service History**: Log maintenance records with PDF reports.
- **Search & Filter**: Find assets by ID, Name, or Status.

### 2. Lifecycle Tracking
- **Timeline View**: Visual history of an asset from acquisition to replacement.
- **Replacement Workflow**: Retire assets and link them to their replacements.
- **Status Tracking**: Active, Service Due, Overdue, Replaced, Retired.

### 3. Financial Intelligence
- **Dashboard**: Charts showing Asset Value Distribution and Top Spenders.
- **Smart Alerts (AI)**:
  - **High Cost**: Warns if maintenance > 50% of purchase cost.
  - **Expiry**: Alerts 30 days before Warranty/AMC expiry.
- **Key Metrics**: Total Asset Value, Total Service Spend, ROI helpers.

### 4. Reporting & Mobile
- **CSV Export**: Download asset data for Excel.
- **Mobile-First**: Responsive "Card View" for mobile devices.
- **QR Code Identity**: Public read-only view for scanning asset tags.

## Setup Instructions

### Backend (Google Apps Script)
1. Create a new Google Sheet.
2. Open **Extensions > Apps Script**.
3. Copy the code from `cms_assets_script.js`.
4. Run `setupAssetsSheet()` **once** to initialize headers.
5. Deploy as Web App (Execute as: **Me**, Access: **Anyone**).
6. Copy the **Web App URL**.

### Frontend (React)
1. Rename `.env.example` to `.env`.
2. Set `VITE_ASSETS_SCRIPT_URL` to your Web App URL.
3. Run `npm install`.
4. Start dev server: `npm run dev`.

## Project Structure
- `src/pages/AssetsPanel.jsx`: Main Dashboard.
- `src/pages/AssetDetails.jsx`: Individual Asset View (Service, Lifecycle).
- `src/pages/PublicAssetView.jsx`: Read-only view for QR codes.
- `src/services/assetsService.js`: API layer interacting with Google Apps Script.

## Tech Stack
- **Frontend**: React, Vite, TailwindCSS, Framer Motion, Lucide Icons, Recharts.
- **Backend**: Google Apps Script, Google Sheets (Database), Google Drive (File Storage).
