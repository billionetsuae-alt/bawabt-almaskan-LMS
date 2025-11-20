import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive'
];

// Initialize Google Sheets client
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

// Export spreadsheet ID directly
export const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// Sheet names
export const SHEETS = {
  USERS: 'Users',
  EMPLOYEES: 'Employees',
  ATTENDANCE: 'Attendance',
  SITES: 'Sites',
  AUDIT_LOGS: 'AuditLogs'
};

/**
 * Get Google Auth client
 */
export async function getAuth() {
  return auth;
}

/**
 * Get data from a specific sheet
 */
export async function getSheetData(sheetName, range = '') {
  try {
    const fullRange = range ? `${sheetName}!${range}` : sheetName;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: fullRange,
    });
    return response.data.values || [];
  } catch (error) {
    console.error(`Error reading from ${sheetName}:`, error.message);
    throw new Error(`Failed to read from Google Sheets: ${error.message}`);
  }
}

/**
 * Append data to a sheet
 */
export async function appendToSheet(sheetName, values) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: sheetName,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error.message);
    throw new Error(`Failed to append to Google Sheets: ${error.message}`);
  }
}

/**
 * Update specific cells in a sheet
 */
export async function updateSheet(sheetName, range, values) {
  try {
    const response = await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!${range}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating ${sheetName}:`, error.message);
    throw new Error(`Failed to update Google Sheets: ${error.message}`);
  }
}

/**
 * Delete a row from a sheet (by marking as deleted)
 */
export async function deleteRow(sheetName, rowIndex, totalColumns) {
  try {
    // Mark as deleted by updating first column
    const range = `${sheetName}!A${rowIndex}:A${rowIndex}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [['DELETED']] },
    });
    return true;
  } catch (error) {
    console.error(`Error deleting row in ${sheetName}:`, error.message);
    throw new Error(`Failed to delete row: ${error.message}`);
  }
}

/**
 * Clear a sheet (keep headers)
 */
export async function clearSheet(sheetName) {
  try {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:Z`,
    });
    return true;
  } catch (error) {
    console.error(`Error clearing ${sheetName}:`, error.message);
    throw new Error(`Failed to clear sheet: ${error.message}`);
  }
}

/**
 * Initialize sheet headers
 */
export async function initializeSheetHeaders() {
  const headers = {
    [SHEETS.USERS]: [
      ['id', 'email', 'password', 'name', 'role', 'active', 'createdAt', 'lastLogin']
    ],
    [SHEETS.EMPLOYEES]: [
      ['id', 'name', 'profession', 'perDaySalary', 'perHourSalary', 'siteId', 'active', 'joiningDate', 'notes', 'createdAt', 'updatedAt']
    ],
    [SHEETS.ATTENDANCE]: [
      ['id', 'employeeId', 'date', 'status', 'otHours', 'siteId', 'notes', 'markedBy', 'approvedBy', 'approved', 'markedAt', 'lastEditedAt', 'approvedAt']
    ],
    [SHEETS.SITES]: [
      ['id', 'siteNumber', 'siteName', 'location', 'active', 'createdAt', 'updatedAt']
    ],
    [SHEETS.AUDIT_LOGS]: [
      ['id', 'timestamp', 'userId', 'userName', 'action', 'entity', 'entityId', 'details']
    ]
  };

  try {
    for (const [sheetName, headerRow] of Object.entries(headers)) {
      await updateSheet(sheetName, 'A1:Z1', headerRow);
      console.log(`✅ Initialized headers for ${sheetName}`);
    }
    return true;
  } catch (error) {
    console.error('Error initializing headers:', error.message);
    throw error;
  }
}

/**
 * Generate unique ID
 */
export function generateId(prefix = '') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${prefix}${timestamp}${random}`;
}

/**
 * Find row index by ID
 */
export async function findRowIndexById(sheetName, id) {
  const data = await getSheetData(sheetName);
  const rowIndex = data.findIndex((row, index) => index > 0 && row[0] === id);
  return rowIndex > 0 ? rowIndex + 1 : -1; // +1 because sheets are 1-indexed
}

export default {
  getSheetData,
  appendToSheet,
  updateSheet,
  deleteRow,
  clearSheet,
  initializeSheetHeaders,
  generateId,
  findRowIndexById,
  SHEETS
};
