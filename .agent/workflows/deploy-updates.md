---
description: how to deploy the SBH CMS updates
---
# SBH CMS Deployment Workflow

Follow these steps to deploy the Master Fix + Self-Healing updates.

## 1. Google Apps Script Update
1. Open your Google Apps Script editor.
2. Copy the entire contents of [google_script_update_fixed.js](file:///c:/Users/Administrator/Downloads/New%20folder/sbh_cms/google_script_update_fixed.js) and paste it into the editor (replacing all existing code).
3. **IMPORTANT**: Set up a Time-Based Trigger:
   - Function to run: `selfHealingEngine`
   - Trigger type: Time-driven
   - Frequency: Every 10 minutes

## 2. Frontend Build
// turbo
1. Run `npm run build` to create the production bundle.
2. Deploy the `dist` folder to your hosting provider (e.g., Vercel, Netlify).

## 3. Verification
1. Log in as an Admin.
2. Check the "User Performance" tab to see if headers are correctly initialized.
3. Check the "Delayed" tickets count on the dashboard.
4. Verify that journey logs now show seconds in timestamps (e.g., `11:39:22 AM`).
