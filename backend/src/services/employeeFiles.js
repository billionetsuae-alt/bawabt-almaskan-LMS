import { google } from 'googleapis';
import dotenv from 'dotenv';
import { getAuth } from './googleSheets.js';

dotenv.config();

const EMPLOYEE_FILES_FOLDER_ID = process.env.EMPLOYEE_FILES_FOLDER_ID;

async function getDriveClient() {
  const auth = await getAuth();
  return google.drive({ version: 'v3', auth });
}

export async function createTestFileForEmployee(employeeId) {
  if (!EMPLOYEE_FILES_FOLDER_ID) {
    throw new Error('EMPLOYEE_FILES_FOLDER_ID is not configured');
  }

  const drive = await getDriveClient();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `Employee_${employeeId}_TEST_${timestamp}`;

  const file = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.document',
      parents: [EMPLOYEE_FILES_FOLDER_ID]
    },
    fields: 'id, name, webViewLink, webContentLink'
  });

  return {
    id: file.data.id,
    name: file.data.name,
    webViewLink: file.data.webViewLink,
    webContentLink: file.data.webContentLink || null
  };
}

export default {
  createTestFileForEmployee
};
